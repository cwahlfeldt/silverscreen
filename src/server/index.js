import express from 'express';
import path from 'path';
import fs from 'fs';
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
} from './sessionManager.js';
import { Screenshotter } from '../capture/screenshotter.js';
import { loadConfig } from '../capture/configLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve built React app in production
const distDir = path.resolve(__dirname, '../../dist');
app.use(express.static(distDir));

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

    // Run capture asynchronously after response
    setImmediate(async () => {
      const total = urls.length * browsers.length * Object.keys(breakpoints || {}).length;
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
        broadcastSSE({ type: 'error', sessionId: session.id, message: err.message });
        try { await screenshotter.close(); } catch (_) { /* ignore */ }
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

// SPA fallback — serve index.html for non-API routes
app.get('*', (_req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build the frontend first: npm run build');
  }
});

export function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`Silverscreen server running at http://localhost:${port}`);
  });
}

// Auto-start when run directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}
