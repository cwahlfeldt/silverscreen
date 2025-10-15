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

## License

MIT
