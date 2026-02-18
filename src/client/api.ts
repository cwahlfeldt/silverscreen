/**
 * API base URL helper.
 *
 * Three execution contexts:
 *
 * 1. Browser dev  (npm run dev)
 *    - window.location.origin = http://localhost:5173
 *    - Vite proxy routes /api → Express on :3001
 *    - getApiBase() returns ''  (relative URLs work fine)
 *    - waitForServer() resolves immediately
 *
 * 2. Tauri dev  (npm run dev:tauri)
 *    - Tauri WebView loads http://localhost:5173 (same Vite dev server)
 *    - __TAURI_INTERNALS__ is present BUT Vite proxy still works
 *    - getApiBase() returns ''  (use Vite proxy, skip sidecar IPC)
 *    - waitForServer() resolves immediately
 *
 * 3. Tauri production  (npm run build:tauri)
 *    - WebView loads from tauri:// or localhost:<random>
 *    - Must use sidecar port from Rust IPC
 *    - getApiBase() invokes get_server_port command
 *    - waitForServer() waits for 'server-ready' event
 */

const isTauri = '__TAURI_INTERNALS__' in window;

// In Tauri dev mode the WebView points at the Vite dev server on :5173,
// so the Vite proxy is available and we don't need the sidecar port.
const isTauriDev = isTauri && window.location.port === '5173';

// True only when running as a packaged Tauri app (production sidecar).
const useSidecar = isTauri && !isTauriDev;

let _baseUrl: string | null = null;
let _serverReady = false;

export async function getApiBase(): Promise<string> {
  if (!useSidecar) return ''; // Vite proxy handles /api

  if (_baseUrl) return _baseUrl;

  const { invoke } = await import('@tauri-apps/api/core');
  const port = await invoke<number>('get_server_port');
  _baseUrl = `http://localhost:${port}`;
  return _baseUrl;
}

/**
 * Resolves once the sidecar server is ready.
 * In browser dev and Tauri dev modes resolves immediately.
 * In Tauri production waits for the 'server-ready' event from Rust,
 * with a fallback in case the event already fired before we listened.
 */
export async function waitForServer(): Promise<void> {
  if (!useSidecar) return;
  if (_serverReady) return;

  return new Promise((resolve) => {
    import('@tauri-apps/api/event').then(({ listen }) => {
      // Listen for future events
      listen('server-ready', () => {
        _serverReady = true;
        resolve();
      });

      // Also poll get_server_port in case the event already fired
      // before this listener was registered (race condition on fast machines)
      import('@tauri-apps/api/core').then(({ invoke }) => {
        const poll = setInterval(() => {
          invoke<number>('get_server_port')
            .then((port) => {
              if (port) {
                _serverReady = true;
                _baseUrl = `http://localhost:${port}`;
                clearInterval(poll);
                resolve();
              }
            })
            .catch(() => { /* not ready yet */ });
        }, 200);
      });
    });
  });
}
