# Silverscreen → Tauri Desktop App Migration Plan

## Overview

This plan outlines converting Silverscreen from an Express + Vite web app into a standalone macOS/Windows/Linux desktop application using [Tauri](https://tauri.app/). The goal is a single distributable `.app` / `.exe` / `.AppImage` that bundles the React frontend and drives Playwright captures natively — no browser, no terminal, no Node.js runtime required for end users.

**Estimated effort:** 3–5 days for a working prototype; 1–2 additional days for packaging and distribution.

---

## Architecture Shift

### Current (Web App)

```
[User's Browser]
      ↕  HTTP / SSE
[Express :3001]
      ↕  Node.js API calls
[Playwright + Filesystem]
```

### Target (Tauri Desktop App)

```
[Tauri WebView  ←→  Tauri Rust Core]
  (React UI)           ↕  Tauri IPC (invoke / emit)
                  [Node.js Sidecar]
                       ↕  stdio / JSON-RPC
                  [Playwright + Filesystem]
```

Tauri's WebView renders the React frontend. The Rust core handles window management and bridges calls to a **Node.js sidecar** — a bundled `node` binary + your Express server — via Tauri's sidecar mechanism. This lets Playwright run exactly as it does today with minimal code changes.

> **Why a sidecar instead of rewriting in Rust?**
> Playwright has no Rust SDK. Rewriting the capture engine in Rust is not feasible. A Node.js sidecar is the official Tauri pattern for embedding runtimes that lack Rust equivalents. The sidecar is bundled inside the app bundle and launched at startup.

---

## Phase 1 — Prerequisites & Tooling Setup

### 1.1 Install Rust + Tauri CLI

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli --version "^2"

# Or via npm (either works)
npm install --save-dev @tauri-apps/cli@^2
```

### 1.2 macOS Prerequisites

```bash
xcode-select --install
```

### 1.3 Verify

```bash
cargo tauri info
```

---

## Phase 2 — Initialize Tauri in the Existing Project

### 2.1 Run Tauri Init

From the project root:

```bash
cargo tauri init
```

Answer the prompts:
| Prompt | Answer |
|--------|--------|
| App name | `Silverscreen` |
| Window title | `Silverscreen` |
| Web assets path | `../dist` |
| Dev server URL | `http://localhost:5173` |
| Frontend dev command | `npm run dev:frontend` |
| Frontend build command | `npm run build` |

This creates:
```
src-tauri/
  Cargo.toml        — Rust dependencies
  tauri.conf.json   — App config (icons, bundle ID, permissions)
  src/
    main.rs         — Tauri app entry point
    lib.rs          — Commands + event handlers
  icons/            — App icon variants
  capabilities/     — Tauri v2 permission system
```

### 2.2 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "tauri dev",
    "dev:frontend": "vite",
    "build": "tsc -b && vite build",
    "tauri:build": "tauri build"
  }
}
```

---

## Phase 3 — Node.js Sidecar Setup

This is the core of the migration. The Express server runs as a Tauri sidecar — a bundled subprocess managed by the Rust core.

### 3.1 Create a Standalone Sidecar Entry Point

Create `src/sidecar/server.js` — a self-contained version of the Express server that communicates its assigned port back to Tauri via stdout:

```js
// src/sidecar/server.js
import express from 'express';
// ... same imports as src/server/index.js

const PORT = parseInt(process.env.PORT || '0', 10); // 0 = OS assigns free port
const app = express();
// ... same middleware and routes as current index.js

const server = app.listen(PORT, () => {
  const addr = server.address();
  // Signal ready + assigned port to Tauri Rust core via stdout
  process.stdout.write(JSON.stringify({ ready: true, port: addr.port }) + '\n');
});
```

Key change: use `PORT=0` so the OS assigns a free port, then write the port to stdout so the Rust sidecar wrapper knows where to connect.

### 3.2 Bundle the Sidecar with `pkg`

Use `pkg` to compile the Node.js sidecar into a standalone binary (no Node.js runtime needed):

```bash
npm install --save-dev pkg
```

Add to `package.json`:

```json
{
  "scripts": {
    "build:sidecar": "pkg src/sidecar/server.js --target node18-macos-arm64,node18-macos-x64,node18-win-x64,node18-linux-x64 --out-path src-tauri/binaries/"
  },
  "pkg": {
    "assets": ["src/server/**/*", "src/capture/**/*", "dist/**/*"],
    "scripts": ["src/**/*.js"]
  }
}
```

Tauri expects sidecar binaries named with the target triple:

```
src-tauri/binaries/
  silverscreen-server-aarch64-apple-darwin    (macOS Apple Silicon)
  silverscreen-server-x86_64-apple-darwin     (macOS Intel)
  silverscreen-server-x86_64-pc-windows-msvc.exe
  silverscreen-server-x86_64-unknown-linux-gnu
```

### 3.3 Register the Sidecar in `tauri.conf.json`

```json
{
  "bundle": {
    "externalBin": ["binaries/silverscreen-server"]
  },
  "plugins": {
    "shell": {
      "sidecar": true
    }
  }
}
```

### 3.4 Configure Playwright Browser Path

`pkg` cannot bundle Playwright's browser binaries. Two options:

**Option A (Recommended for distribution):** Bundle browser binaries alongside the app in the OS-standard app data directory, downloaded on first launch.

**Option B (Development/power users):** Require users to run `npx playwright install chromium` once. The sidecar reads `PLAYWRIGHT_BROWSERS_PATH` from the environment.

For Option A, add a first-run setup Tauri command (see Phase 4.3).

---

## Phase 4 — Rust Core: Sidecar Management + IPC

Edit `src-tauri/src/lib.rs`:

### 4.1 Launch Sidecar at App Start

```rust
use tauri_plugin_shell::ShellExt;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let sidecar_command = app.shell()
                .sidecar("silverscreen-server")?
                .env("PORT", "0");

            let (mut rx, _child) = sidecar_command.spawn()?;

            // Store the port once the sidecar signals ready
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let tauri_plugin_shell::process::CommandEvent::Stdout(line) = event {
                        if let Ok(msg) = serde_json::from_slice::<serde_json::Value>(&line) {
                            if msg["ready"] == true {
                                let port = msg["port"].as_u64().unwrap();
                                app_handle.manage(ServerPort(port as u16));
                                // Notify frontend that backend is ready
                                app_handle.emit("server-ready", port).ok();
                            }
                        }
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_server_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

struct ServerPort(u16);

#[tauri::command]
fn get_server_port(state: tauri::State<ServerPort>) -> u16 {
    state.0
}
```

### 4.2 Required Rust Dependencies (`src-tauri/Cargo.toml`)

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

### 4.3 First-Run Playwright Browser Download Command

```rust
#[tauri::command]
async fn install_playwright_browsers(app: tauri::AppHandle) -> Result<(), String> {
    let (mut rx, _child) = app.shell()
        .sidecar("silverscreen-server")
        .map_err(|e| e.to_string())?
        .args(["--install-browsers"])
        .spawn()
        .map_err(|e| e.to_string())?;

    while let Some(event) = rx.recv().await {
        // stream progress back to frontend
        if let tauri_plugin_shell::process::CommandEvent::Stdout(line) = event {
            app.emit("browser-install-progress", String::from_utf8_lossy(&line).to_string()).ok();
        }
    }
    Ok(())
}
```

---

## Phase 5 — Frontend Adaptation

The React frontend needs minimal changes. The main difference: instead of hardcoded `/api` paths, API calls must be directed to the dynamically assigned sidecar port.

### 5.1 Create an API Base URL Helper

Create `src/client/api.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

let baseUrl: string | null = null;

export async function getApiBase(): Promise<string> {
  if (baseUrl) return baseUrl;
  const port = await invoke<number>('get_server_port');
  baseUrl = `http://localhost:${port}`;
  return baseUrl;
}

export async function waitForServer(): Promise<void> {
  return new Promise((resolve) => {
    listen('server-ready', () => resolve());
  });
}
```

### 5.2 Update API Calls in Components

Replace direct `/api/...` fetch calls with the helper:

```typescript
// Before
const res = await fetch('/api/sessions');

// After
const base = await getApiBase();
const res = await fetch(`${base}/api/sessions`);
```

Files to update:
- [src/client/App.tsx](src/client/App.tsx) — session fetching
- [src/client/components/CapturePanel.tsx](src/client/components/CapturePanel.tsx) — capture POST + SSE URL
- [src/client/components/SessionSidebar.tsx](src/client/components/SessionSidebar.tsx) — session list + delete
- [src/client/components/ComparisonGrid.tsx](src/client/components/ComparisonGrid.tsx) — screenshot src URLs

### 5.3 Add a Loading Screen

Show a loading state while waiting for `server-ready`:

```typescript
// src/client/App.tsx
import { waitForServer } from './api';

function App() {
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    waitForServer().then(() => setServerReady(true));
  }, []);

  if (!serverReady) {
    return <SplashScreen message="Starting capture engine..." />;
  }
  // ... rest of app
}
```

### 5.4 Install Tauri API Package

```bash
npm install @tauri-apps/api
```

---

## Phase 6 — Tauri Permissions (v2 Capability System)

Tauri v2 uses an explicit permission system. Create `src-tauri/capabilities/main.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Main window capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-execute",
    "shell:allow-open"
  ]
}
```

---

## Phase 7 — Session Data & File Storage

Currently sessions are stored in `data/` relative to the project root. In a packaged app this won't exist. Update `src/server/sessionManager.js` to use the OS app data directory.

The sidecar should accept an env var for the data directory:

```js
// src/sidecar/server.js
const DATA_DIR = process.env.SILVERSCREEN_DATA_DIR
  || path.join(os.homedir(), '.silverscreen', 'data');
```

In Rust, resolve the app data directory and pass it to the sidecar:

```rust
let data_dir = app.path().app_data_dir()?.join("sessions");
std::fs::create_dir_all(&data_dir)?;

let sidecar = app.shell()
    .sidecar("silverscreen-server")?
    .env("SILVERSCREEN_DATA_DIR", data_dir.to_str().unwrap())
    .env("PORT", "0");
```

---

## Phase 8 — App Icons & Bundle Config

### 8.1 Generate Icons

Place a 1024×1024 PNG at `src-tauri/icons/icon.png`, then:

```bash
cargo tauri icon src-tauri/icons/icon.png
```

This generates all required icon sizes for macOS (`.icns`), Windows (`.ico`), and Linux (`.png`).

### 8.2 `tauri.conf.json` — Key Settings

```json
{
  "productName": "Silverscreen",
  "version": "2.0.0",
  "identifier": "com.silverscreen.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev:frontend",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "Silverscreen",
        "width": 1440,
        "height": 900,
        "minWidth": 1024,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"],
    "externalBin": ["binaries/silverscreen-server"]
  }
}
```

---

## Phase 9 — Build & Distribution

### 9.1 Development Workflow

```bash
# Build the sidecar binary first
npm run build:sidecar

# Start Tauri in dev mode (hot-reloads the WebView, restarts sidecar on rebuild)
npm run dev
```

### 9.2 Production Build

```bash
# 1. Build React frontend
npm run build

# 2. Build sidecar binary for current platform
npm run build:sidecar

# 3. Build Tauri app
npm run tauri:build
```

Outputs:
- macOS: `src-tauri/target/release/bundle/macos/Silverscreen.app` + `.dmg`
- Windows: `src-tauri/target/release/bundle/msi/Silverscreen.msi`
- Linux: `src-tauri/target/release/bundle/appimage/silverscreen.AppImage`

### 9.3 Code Signing (macOS)

For distribution outside the Mac App Store:

```bash
# Set in environment or CI
export APPLE_CERTIFICATE="..."
export APPLE_CERTIFICATE_PASSWORD="..."
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="your@apple.id"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAMID"
```

Then `tauri build` handles signing and notarization automatically when these vars are set.

---

## Phase 10 — First-Run Experience

On first launch, Playwright browsers need to be available. The recommended flow:

1. App opens → Rust checks for browser binaries in app data directory
2. If missing → show an onboarding screen ("Setting up capture engine...")
3. Invoke `install_playwright_browsers` Tauri command
4. Stream progress to frontend via `browser-install-progress` event
5. On completion → proceed to normal app startup

This is a one-time download (~130MB for Chromium only, ~400MB for all three browsers). Consider shipping only Chromium by default and letting users add Firefox/WebKit via a settings panel.

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `pkg` fails to bundle Playwright's dynamic imports | Medium | Use `--no-native-rebuild` flag; test thoroughly; consider `nexe` as alternative |
| Browser binary path resolution breaks inside `.app` bundle | Medium | Use `PLAYWRIGHT_BROWSERS_PATH` env var pointing to app data dir |
| Windows Defender flags the sidecar binary | Low–Medium | Code sign the binary; submit to Microsoft for analysis |
| SSE connections don't work cross-origin (sidecar port vs WebView origin) | Low | Add `cors` middleware to Express with `origin: '*'` for localhost |
| Playwright `pkg` snapshot misses `.js` files loaded dynamically | Medium | Audit and explicitly list assets in `pkg` config |
| Tauri sidecar lifecycle — zombie processes on crash | Low | Implement `app.on_window_event` to kill sidecar on window close |

---

## File Checklist

New files to create:
- [ ] `src-tauri/` — generated by `tauri init`
- [ ] `src/sidecar/server.js` — sidecar entry point
- [ ] `src/client/api.ts` — dynamic API base URL helper
- [ ] `src-tauri/capabilities/main.json` — Tauri v2 permissions

Files to modify:
- [ ] `package.json` — add `tauri` scripts + `pkg` config
- [ ] `src/server/sessionManager.js` — respect `SILVERSCREEN_DATA_DIR`
- [ ] `src/client/App.tsx` — `waitForServer` splash + `getApiBase`
- [ ] `src/client/components/CapturePanel.tsx` — dynamic API URLs
- [ ] `src/client/components/SessionSidebar.tsx` — dynamic API URLs
- [ ] `src/client/components/ComparisonGrid.tsx` — dynamic screenshot URLs
- [ ] `vite.config.ts` — remove `/api` proxy (no longer needed in production)

---

## Useful References

- [Tauri v2 Docs](https://v2.tauri.app/)
- [Tauri Sidecar Guide](https://v2.tauri.app/develop/sidecar/)
- [Tauri Shell Plugin](https://v2.tauri.app/plugin/shell/)
- [pkg — Node.js packager](https://github.com/vercel/pkg)
- [Playwright Environment Variables](https://playwright.dev/docs/ci#github-actions)
- [Tauri v2 Capabilities / Permissions](https://v2.tauri.app/security/capabilities/)
