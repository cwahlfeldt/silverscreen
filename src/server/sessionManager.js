import fs from 'fs';
import path from 'path';
import { generateManifest } from '../capture/generateManifest.js';

const DATA_DIR = path.resolve('data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const SESSIONS_INDEX = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  if (!fs.existsSync(SESSIONS_INDEX)) fs.writeFileSync(SESSIONS_INDEX, '[]');
}

function readIndex() {
  ensureDataDir();
  return JSON.parse(fs.readFileSync(SESSIONS_INDEX, 'utf-8'));
}

function writeIndex(sessions) {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_INDEX, JSON.stringify(sessions, null, 2));
}

export function createSession({ name, urls, browsers, breakpoints }) {
  ensureDataDir();

  const id = `${slugify(name)}-${Date.now()}`;
  const sessionDir = path.join(SESSIONS_DIR, id);
  const screenshotsDir = path.join(sessionDir, 'screenshots');

  fs.mkdirSync(screenshotsDir, { recursive: true });

  const session = {
    id,
    name,
    createdAt: new Date().toISOString(),
    urls,
    browsers,
    breakpoints,
    urlCount: urls.length,
  };

  fs.writeFileSync(
    path.join(sessionDir, 'session.json'),
    JSON.stringify(session, null, 2)
  );

  const index = readIndex();
  index.unshift({
    id,
    name,
    createdAt: session.createdAt,
    urlCount: urls.length,
    browsers,
  });
  writeIndex(index);

  return session;
}

export function listSessions() {
  return readIndex();
}

export function getSession(id) {
  const sessionDir = path.join(SESSIONS_DIR, id);
  const sessionFile = path.join(sessionDir, 'session.json');

  if (!fs.existsSync(sessionFile)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
}

export function deleteSession(id) {
  const sessionDir = path.join(SESSIONS_DIR, id);

  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }

  const index = readIndex().filter(s => s.id !== id);
  writeIndex(index);
}

export function getSessionScreenshotsDir(id) {
  return path.join(SESSIONS_DIR, id, 'screenshots');
}

export function generateSessionManifest(id) {
  const sessionDir = path.join(SESSIONS_DIR, id);
  const screenshotsDir = path.join(sessionDir, 'screenshots');
  const manifestPath = path.join(sessionDir, 'manifest.json');
  return generateManifest(screenshotsDir, manifestPath);
}

export function getSessionManifest(id) {
  const manifestPath = path.join(SESSIONS_DIR, id, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

export function getSessionScreenshotsPath(id) {
  return path.join(SESSIONS_DIR, id, 'screenshots');
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
