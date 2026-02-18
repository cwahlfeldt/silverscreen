/**
 * Tauri sidecar entry point.
 *
 * This file is compiled into a standalone binary by `pkg` and bundled inside
 * the Tauri app. It starts the Express server on a free OS-assigned port
 * (PORT=0) and signals readiness + the assigned port to the Tauri Rust core
 * via a single JSON line on stdout.
 *
 * It is functionally identical to src/server/index.js, with two differences:
 *   1. Uses SILVERSCREEN_DATA_DIR env var for all session/data storage paths.
 *   2. Writes { ready: true, port } to stdout instead of logging to console.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  createSession,
  listSessions,
  getSession,
  deleteSession,
  getSessionScreenshotsDir,
  generateSessionManifest,
  getSessionManifest,
  getSessionScreenshotsPath,
} from '../server/sessionManager.js';
import { getProfile, updateProfile } from '../server/profileManager.js';
import { Screenshotter } from '../capture/screenshotter.js';
import { loadConfig } from '../capture/configLoader.js';

// ---------------------------------------------------------------------------
// Handle --install-browsers flag (called by Tauri on first run)
// ---------------------------------------------------------------------------
if (process.argv.includes('--install-browsers')) {
  const { execSync } = await import('child_process');
  try {
    process.stdout.write('Installing Playwright browsers...\n');
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    process.stdout.write('Browser installation complete.\n');
  } catch (err) {
    process.stderr.write(`Browser installation failed: ${err.message}\n`);
    process.exit(1);
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Data directory — use env var set by Tauri, fall back to ~/.silverscreen
// ---------------------------------------------------------------------------
const DATA_DIR =
  process.env.SILVERSCREEN_DATA_DIR ||
  path.join(os.homedir(), '.silverscreen', 'data');

// Expose to sessionManager and profileManager via env so they don't need
// to be re-architected just for the sidecar.
process.env.SILVERSCREEN_DATA_DIR = DATA_DIR;
fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Express app (mirrors src/server/index.js)
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// PORT=0 → OS picks a free port
const PORT = parseInt(process.env.PORT || '0', 10);

app.use(express.json());

// CORS — required because the Tauri WebView is a different origin from the
// dynamically assigned localhost port.
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// --- SSE client registry ---
const sseClients = new Set();

function broadcastSSE(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) {
    res.write(data);
  }
}

// --- Config ---
let runtimeConfig = null;

app.get('/api/config', async (_req, res) => {
  try {
    const config = await loadConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', (req, res) => {
  runtimeConfig = req.body;
  res.json({ ok: true });
});

// --- Profile ---
app.get('/api/profile', (_req, res) => {
  try {
    res.json(getProfile());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', (req, res) => {
  try {
    const updated = updateProfile(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Sessions ---
app.get('/api/sessions', (_req, res) => {
  res.json(listSessions());
});

app.get('/api/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.delete('/api/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  deleteSession(req.params.id);
  res.json({ ok: true });
});

app.get('/api/sessions/:id/manifest', (req, res) => {
  const manifest = getSessionManifest(req.params.id);
  if (!manifest) return res.status(404).json({ error: 'Manifest not found' });
  res.json(manifest);
});

app.use('/api/sessions/:id/screenshots', (req, res, next) => {
  const screenshotsPath = getSessionScreenshotsPath(req.params.id);
  express.static(screenshotsPath)(req, res, next);
});

// --- Capture ---
app.post('/api/capture', async (req, res) => {
  try {
    const fileConfig = await loadConfig();
    const config = { ...fileConfig, ...(runtimeConfig || {}) };

    const {
      name = `Session ${new Date().toLocaleDateString()}`,
      urls = config.urls || [],
      browsers = config.browsers || ['chromium'],
      breakpoints = config.breakpoints,
    } = req.body;

    if (!urls || urls.length === 0) {
      return res.status(400).json({ error: 'No URLs provided' });
    }

    const session = createSession({ name, urls, browsers, breakpoints });
    const outputDir = getSessionScreenshotsDir(session.id);

    res.json({ sessionId: session.id });

    setImmediate(async () => {
      const total =
        urls.length *
        browsers.length *
        Object.keys(breakpoints || {}).length;
      broadcastSSE({ type: 'start', sessionId: session.id, total });

      const screenshotter = new Screenshotter({
        ...config,
        browsers,
        breakpoints: breakpoints || config.breakpoints,
      });

      screenshotter.on('progress', (event) => {
        broadcastSSE({ type: 'progress', sessionId: session.id, ...event });
      });

      screenshotter.on('error', (event) => {
        broadcastSSE({ type: 'error', sessionId: session.id, ...event });
      });

      try {
        await screenshotter.init();
        for (const url of urls) {
          await screenshotter.captureScreenshots(url, outputDir);
        }
        await screenshotter.close();
        generateSessionManifest(session.id);
        broadcastSSE({ type: 'complete', sessionId: session.id });
      } catch (err) {
        broadcastSSE({
          type: 'error',
          sessionId: session.id,
          message: err.message,
        });
        try {
          await screenshotter.close();
        } catch (_) {
          // ignore
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/capture/status', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ---------------------------------------------------------------------------
// Start server + signal Tauri
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  const addr = server.address();
  // This JSON line is parsed by the Rust sidecar listener in lib.rs
  process.stdout.write(JSON.stringify({ ready: true, port: addr.port }) + '\n');
});
