# Silverscreen

Capture responsive website screenshots across multiple browsers and compare them side by side in a dark, cinematic web UI.

## Installation

```bash
npm install
```

## Usage

### Web UI (recommended)

Start the server and open the browser interface:

```bash
npm start
# → http://localhost:3001
```

During development, run the Express server and Vite dev server together:

```bash
npm run dev
# → Vite at http://localhost:5173 (proxies /api to :3001)
```

From the UI you can:
- Start a new capture (name it, set URLs, choose browsers)
- Watch live progress as screenshots are taken
- Browse all past sessions in the sidebar
- Compare screenshots side by side with synced scrolling
- Filter by page, browser, and breakpoint
- Open full-size in a modal and download

### Headless CLI

Run a capture without starting the server:

```bash
node bin/silverscreen.js capture
# Uses URLs from silverscreen.config.js

node bin/silverscreen.js capture urls.txt
# Uses URLs from a text file (one per line)

node bin/silverscreen.js capture -n "My Session"
# Custom session name
```

Sessions captured via CLI are stored the same way and appear in the UI next time you run `npm start`.

## Configuration

Place a `silverscreen.config.js` in the project root:

```javascript
export default {
  urls: [
    'https://example.com',
    'https://example.com/about',
  ],

  browsers: ['chromium', 'firefox', 'webkit'],

  breakpoints: {
    'mobile-390px': 390,
    'tablet-768px': 768,
    'desktop-1440px': 1440,
    'large-1920px': 1920,
  },

  browserOptions: {
    headless: true,
  },

  screenshot: {
    fullPage: true,
  },

  delay: 0,           // ms to wait before taking each screenshot
  hideSelectors: [],  // CSS selectors to hide before capture
  plugins: [],        // see Plugins below
};
```

| Option           | Type   | Default              | Description                                        |
| ---------------- | ------ | -------------------- | -------------------------------------------------- |
| `urls`           | array  | `[]`                 | URLs to capture                                    |
| `browsers`       | array  | `['chromium']`       | `chromium`, `chrome`, `firefox`, `webkit`, `edge`  |
| `breakpoints`    | object | 390/768/1440/1920px  | Viewport widths to capture                         |
| `browserOptions` | object | `{ headless: true }` | Playwright launch options                          |
| `screenshot`     | object | `{ fullPage: true }` | Playwright screenshot options                      |
| `delay`          | number | `0`                  | Extra wait (ms) before capturing                   |
| `hideSelectors`  | array  | `[]`                 | CSS selectors to hide with `display: none`         |
| `plugins`        | array  | `[]`                 | Plugin instances to run before each screenshot     |

## Plugins

Plugins let you interact with the page before screenshots are taken (dismiss modals, accept cookies, etc.).

```javascript
import { CookiePlugin } from './src/capture/plugins/index.js';

export default {
  plugins: [new CookiePlugin()],
};
```

### Built-in plugins

- **`CookiePlugin`** — dismisses `.ila-cookieb__close-button` cookie banners
- **`SandboxPlugin`** — removes `.micromodalcontainer` modal overlays

### Custom plugins

```javascript
import { BasePlugin } from './src/capture/plugins/basePlugin.js';

class MyPlugin extends BasePlugin {
  constructor() {
    super('My Plugin');
  }

  async handle(page) {
    const btn = await page.$('[data-dismiss]');
    if (btn) {
      await btn.click();
      return true;
    }
    return false;
  }
}
```

## Session data

Every capture creates a named session stored in `data/` (gitignored):

```
data/
├── sessions.json
└── sessions/
    └── example-com-1739836800000/
        ├── session.json
        ├── manifest.json
        └── screenshots/
            ├── chromium/
            ├── firefox/
            └── webkit/
```

## npm scripts

| Script          | Description                                      |
| --------------- | ------------------------------------------------ |
| `npm run dev`   | Express + Vite dev server (hot reload)           |
| `npm start`     | Express server serving the built frontend        |
| `npm run build` | Build the React frontend to `dist/`              |
| `npm run capture` | Headless CLI capture (alias for `node bin/silverscreen.js capture`) |

## License

MIT
