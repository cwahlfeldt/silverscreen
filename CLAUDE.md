# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Silverscreen is a CLI tool for capturing responsive website screenshots using Playwright. It processes multiple URLs from a text file and captures screenshots at different breakpoints across multiple browsers (Chromium, Firefox, WebKit, Edge).

## Commands

### Development Commands
- `npm start <urls-file>` - Run the CLI tool with a URLs file
- `npm test` - No tests currently configured

### CLI Usage
- `node bin/silverscreen.js <urls-file> [options]` - Direct execution
- `silverscreen <urls-file> -o <output-dir>` - If installed globally

### Configuration
- Place a `silverscreen.config.js` file in your project root to customize behavior
- CLI will automatically detect and load the config file
- CLI options override config file settings

## Architecture

### Core Components

1. **CLI Entry Point** (`bin/silverscreen.js`)
   - Uses Commander.js for argument parsing
   - Handles file input validation and error reporting
   - Orchestrates the screenshot capture workflow

2. **URL Reader** (`src/urlReader.js`)
   - Reads and validates URLs from text files
   - Filters out invalid URLs using URL constructor validation
   - Returns array of valid URLs for processing

3. **Screenshotter** (`src/screenshotter.js`)
   - Main screenshot capture logic using Playwright
   - Manages multiple browser instances (Chromium, Firefox, WebKit, Edge)
   - Handles viewport sizing for different breakpoints
   - Organizes output by browser: `screenshots/browser-name/site-page/breakpoint.png`
   - Integrates with PluginManager for extensible page interactions

4. **Plugin System** (`src/plugins/`)
   - **BasePlugin** - Abstract base class for all plugins
   - **PluginManager** - Orchestrates plugin execution
   - **Built-in Plugins**:
     - `CookiePlugin` - Dismisses cookie banners (`.ila-cookieb__close-button`)
     - `SandboxPlugin` - Clicks sandbox buttons (`.pds-button`)
   - Plugins are opt-in via config file

5. **Configuration System** (`src/configLoader.js`)
   - Loads `silverscreen.config.js` from project root
   - Provides defaults for all settings
   - Supports plugins, breakpoints, browser options, and screenshot settings

### Key Design Patterns

- **Configuration-First Architecture**: Flexible, file-based configuration
  - `silverscreen.config.js` in project root for customization
  - Supports plugins, browsers, breakpoints, browser options, and screenshot settings
  - CLI options override config file settings
- **Multi-Browser Support**: Capture screenshots across multiple browsers
  - Supported browsers: Chromium, Chrome, Firefox, WebKit, Edge
  - Configurable via `browsers` array in config
  - Defaults to Chromium only if not specified
- **Plugin Architecture**: Extensible system for handling site-specific interactions
  - Plugins extend BasePlugin and implement `handle(page)` method
  - Zero plugins loaded by default - pure screenshot capture out of the box
  - Users opt-in to plugins via config file
- **Breakpoint Configuration**: Predefined responsive breakpoints (390px, 768px, 1440px, 1920px)
- **File Organization**: Screenshots organized by browser, then page: `screenshots/browser/page/breakpoint.png`
- **Error Handling**: Graceful error handling with console logging per browser
- **Browser Management**: Multiple browser instances launched concurrently, each with individual pages per URL

### Dependencies

- **playwright**: Web scraping and screenshot capture (supports Chromium, Firefox, WebKit)
- **commander**: CLI argument parsing and command structure
- **Node.js built-ins**: fs, path for file operations

### File Structure

```
bin/silverscreen.js                        - CLI entry point
src/
  urlReader.js                             - URL file processing
  screenshotter.js                         - Screenshot capture logic
  configLoader.js                          - Configuration file loader
  plugins/
    index.js                               - Plugin system exports
    basePlugin.js                          - Base plugin class
    cookiePlugin.js                        - Cookie banner dismissal
    sandboxPlugin.js                       - Sandbox button handling
examples/
  customPlugin.js                          - Example custom plugin (legacy)
  silverscreen.config.js                   - Full config example with plugins
  silverscreen.config.minimal.js           - Minimal config example
  silverscreen.config.custom.js            - Custom plugin example
package.json                               - Node.js project configuration
```

## Configuration

### Basic Configuration

Create a `silverscreen.config.js` file in your project root:

```javascript
export default {
  // Plugins to load
  plugins: [],

  // Output directory
  outputDir: 'screenshots',

  // Browsers to use for screenshots
  // Supported: 'chromium', 'chrome', 'firefox', 'webkit', 'edge'
  // Output structure: screenshots/browser-name/site-page/breakpoint.png
  browsers: ['chromium', 'firefox', 'webkit'],

  // Browser launch options (applies to all browsers)
  browserOptions: {
    headless: true,
  },

  // Screenshot options
  screenshot: {
    fullPage: true,
    // type: 'png', // or 'jpeg', 'webp'
    // quality: 90, // for jpeg/webp only
  },

  // Custom breakpoints (optional)
  breakpoints: {
    'mobile-390px': 390,
    'tablet-768px': 768,
    'desktop-1440px': 1440,
    'large-1920px': 1920,
  },
};
```

### Using Built-in Plugins

Add plugins to your config file:

```javascript
import { CookiePlugin, SandboxPlugin } from 'silverscreen/src/plugins/index.js';

export default {
  plugins: [
    new CookiePlugin(),
    new SandboxPlugin(),
  ],
  outputDir: 'screenshots',
};
```

### Creating Custom Plugins

Extend BasePlugin and add to your config:

```javascript
import { BasePlugin } from 'silverscreen/src/plugins/basePlugin.js';
import { CookiePlugin } from 'silverscreen/src/plugins/index.js';

class MyModalPlugin extends BasePlugin {
  constructor() {
    super('Modal Closer');
  }

  async handle(page) {
    try {
      const modal = await page.$('[data-modal-close]');
      if (modal) {
        this.log('Closing modal...');
        await modal.click();
        return true;
      }
    } catch (error) {
      this.log(`Error: ${error.message}`);
    }
    return false;
  }
}

export default {
  plugins: [
    new CookiePlugin(),
    new MyModalPlugin(),
  ],
};
```

### Example Configurations

See the `examples/` directory for complete configuration examples:
- `silverscreen.config.js` - Full example with Cookie and Sandbox plugins
- `silverscreen.config.minimal.js` - Minimal configuration with no plugins
- `silverscreen.config.custom.js` - Custom plugin example with JPEG output
