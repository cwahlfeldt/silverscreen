# Silverscreen

A CLI tool for capturing responsive website screenshots across multiple browsers using Playwright.

## Installation

```bash
npm install
```

## Quick Start

1. Create `silverscreen.config.js`:

```javascript
export default {
  urls: [
    'https://example.com',
    'https://example.com/about',
  ],
  browsers: ['chromium', 'firefox', 'webkit'],
  outputDir: 'screenshots',
};
```

2. Run:

```bash
node bin/silverscreen.js
```

## Output

Screenshots are organized by browser:

```
screenshots/
├── chromium/
│   └── example-com/
│       ├── mobile-390px_*.png
│       ├── tablet-768px_*.png
│       ├── desktop-1440px_*.png
│       └── large-1920px_*.png
├── firefox/
└── webkit/
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `urls` | array | `[]` | URLs to capture |
| `browsers` | array | `['chromium']` | Browsers: `chromium`, `firefox`, `webkit`, `edge` |
| `outputDir` | string | `'screenshots'` | Output directory |
| `breakpoints` | object | See defaults | Custom viewport widths |
| `browserOptions` | object | `{ headless: true }` | Playwright launch options |
| `screenshot` | object | `{ fullPage: true }` | Screenshot options |
| `plugins` | array | `[]` | Custom plugins |

## CLI Usage

```bash
# Use URLs from config
node bin/silverscreen.js

# Use URLs from text file
node bin/silverscreen.js urls.txt

# Custom output directory
node bin/silverscreen.js -o output/
```

## Screenshot Viewer

Silverscreen automatically generates a static comparison viewer that lets you compare screenshots side-by-side across browsers and breakpoints.

### Using the Viewer

1. **Capture Screenshots** - Run silverscreen as normal:
```bash
node bin/silverscreen.js
```

2. **Start Viewer** - The manifest is generated automatically:
```bash
npm run viewer:dev
```

3. **Build Static Site**:
```bash
npm run viewer:build
```

The built viewer will be in `viewer/dist/` and can be deployed to any static hosting service.

### Viewer Features

- **Side-by-side Comparison** - Compare the same page across multiple browsers
- **Breakpoint Filtering** - View all breakpoints or filter to specific sizes
- **Browser Selection** - Toggle which browsers to display
- **Click to Enlarge** - Full-screen modal view with download option
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Static Export** - Self-contained site with all screenshots embedded

### Manual Manifest Generation

If you need to regenerate the viewer manifest without capturing new screenshots:

```bash
npm run viewer:generate
```

## License

MIT
