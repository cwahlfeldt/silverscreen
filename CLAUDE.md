# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Silverscreen is a unified web application for capturing responsive website screenshots and comparing them side by side. It combines an Express API server, a React frontend, and a Playwright screenshot engine into a single package.

## Commands

- `npm run dev` — Start Express server (port 3001) + Vite dev server concurrently
- `npm start` — Start Express server serving the built frontend (production)
- `npm run build` — Build the React frontend to `dist/`
- `npm run capture` — Headless CLI capture (alias for `node bin/silverscreen.js capture`)

## Architecture

### Core Components

1. **Express Server** (`src/server/index.js`)
   - Serves the built React app from `dist/` in production
   - Exposes REST API routes for sessions and capture
   - SSE endpoint (`GET /api/capture/status`) streams live progress during capture
   - In dev, Vite proxies `/api` to this server (port 3001)

2. **Session Manager** (`src/server/sessionManager.js`)
   - Creates, lists, reads, and deletes sessions
   - Each session is a directory under `data/sessions/<id>/` containing `session.json`, `manifest.json`, and `screenshots/`
   - `data/sessions.json` is a lightweight index of all sessions

3. **Screenshotter** (`src/capture/screenshotter.js`)
   - Extends `EventEmitter` — emits `progress` and `error` events used by the SSE endpoint
   - Launches Playwright browsers, captures screenshots at each breakpoint, runs plugins
   - Writes screenshots to a caller-supplied output directory

4. **Plugin System** (`src/capture/plugins/`)
   - `BasePlugin` — extend this, implement `async handle(page)`
   - `PluginManager` — runs all plugins in order before each screenshot
   - Built-ins: `CookiePlugin`, `SandboxPlugin`
   - Loaded via `plugins` array in `silverscreen.config.js`

5. **React Frontend** (`src/client/`)
   - `App.tsx` — session state, manifest fetching, layout
   - `SessionSidebar.tsx` — lists sessions, handles selection and deletion
   - `CapturePanel.tsx` — capture form, POSTs to `/api/capture`, reads SSE progress
   - `ComparisonGrid.tsx` — screenshot grid grouped by breakpoint, synced scroll
   - `ImageModal.tsx` — full-screen image viewer with download
   - `Header.tsx` — pill-shaped filter controls (page, browser, breakpoint)

6. **CLI Entry Point** (`bin/silverscreen.js`)
   - `silverscreen serve` (default) — starts the Express server
   - `silverscreen capture [urls-file]` — headless capture, saves to a session in `data/`

### API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/:id` | Get session metadata |
| DELETE | `/api/sessions/:id` | Delete session and all files |
| GET | `/api/sessions/:id/manifest` | Session manifest JSON |
| GET | `/api/sessions/:id/screenshots/*` | Serve screenshot files |
| POST | `/api/capture` | Start a capture run, returns `{ sessionId }` |
| GET | `/api/capture/status` | SSE stream of capture progress events |
| GET | `/api/config` | Current `silverscreen.config.js` values |
| PUT | `/api/config` | Runtime config overrides (in-memory) |

### File Structure

```
bin/silverscreen.js              — CLI entry point (serve + capture subcommands)
src/
  server/
    index.js                     — Express app, API routes, SSE
    sessionManager.js            — Session CRUD, manifest generation
  capture/
    screenshotter.js             — Playwright capture logic (EventEmitter)
    urlReader.js                 — Parse URLs from text file
    configLoader.js              — Load silverscreen.config.js
    generateManifest.js          — Scan screenshots dir, write manifest.json
    plugins/
      index.js                   — PluginManager + re-exports
      basePlugin.js              — Base class
      cookiePlugin.js            — Cookie banner dismissal
      sandboxPlugin.js           — Modal overlay removal
  client/
    main.tsx                     — React entry point
    App.tsx                      — Root component, session-aware layout
    types.ts                     — TypeScript interfaces
    index.css                    — Tailwind + dark theme + animations
    components/
      Header.tsx
      SessionSidebar.tsx
      CapturePanel.tsx
      ComparisonGrid.tsx
      ImageModal.tsx
data/                            — Runtime session storage (gitignored)
silverscreen.config.js           — Project config (URLs, browsers, breakpoints, plugins)
vite.config.ts                   — React + Tailwind plugins, /api proxy to :3001
```

### Session Data Layout

```
data/
├── sessions.json                          — index: [{ id, name, createdAt, urlCount, browsers }]
└── sessions/
    └── <slug>-<timestamp>/
        ├── session.json                   — full metadata
        ├── manifest.json                  — screenshot index for the viewer
        └── screenshots/
            ├── chromium/<page>/
            ├── firefox/<page>/
            └── webkit/<page>/
```

### Design

- Dark cinematic theme: `#09090f` background, amber (`#fbbf24`) accents, violet secondary
- Font: Space Grotesk (display), system UI (body)
- All styling via Tailwind utility classes + custom keyframe animations in `index.css`
- Dark mode only — no toggle
