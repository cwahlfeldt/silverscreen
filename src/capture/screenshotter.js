import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { PluginManager } from './plugins/index.js';

const DEFAULT_BREAKPOINTS = {
  'mobile-390px': 390,
  'tablet-768px': 768,
  'desktop-1440px': 1440,
  'large-1920px': 1920,
};

const BROWSER_ENGINES = {
  chromium: chromium,
  chrome: chromium,
  firefox: firefox,
  webkit: webkit,
  edge: chromium,
};

class Screenshotter extends EventEmitter {
  constructor(config = {}) {
    super();
    this.browsers = new Map();

    if (Array.isArray(config)) {
      this.config = {
        plugins: config,
        browsers: ['chromium'],
        browserOptions: { headless: true },
        screenshot: { fullPage: true },
        breakpoints: DEFAULT_BREAKPOINTS,
        hideSelectors: [],
        delay: 0,
      };
    } else {
      this.config = {
        plugins: config.plugins || [],
        browsers: config.browsers || ['chromium'],
        browserOptions: config.browserOptions || config.browser || { headless: true },
        screenshot: config.screenshot || { fullPage: true },
        breakpoints: config.breakpoints || DEFAULT_BREAKPOINTS,
        hideSelectors: config.hideSelectors || [],
        delay: config.delay || 0,
      };
    }

    this.pluginManager = new PluginManager(this.config.plugins);
  }

  async init() {
    for (const browserName of this.config.browsers) {
      const browserEngine = BROWSER_ENGINES[browserName.toLowerCase()];
      if (!browserEngine) {
        console.warn(`Unknown browser: ${browserName}`);
        continue;
      }

      try {
        const browserOptions = { ...this.config.browserOptions };
        if (browserName.toLowerCase() === 'edge') {
          browserOptions.channel = 'msedge';
        }
        const browser = await browserEngine.launch(browserOptions);
        this.browsers.set(browserName.toLowerCase(), browser);
      } catch (error) {
        console.error(`Failed to launch ${browserName}: ${error.message}`);
      }
    }

    if (this.browsers.size === 0) {
      throw new Error('No browsers could be launched');
    }
  }

  async close() {
    for (const [, browser] of this.browsers.entries()) {
      try {
        await browser.close();
      } catch (_error) {
        // ignore
      }
    }
    this.browsers.clear();
  }

  createPageDirectoryName(urlObj) {
    let dirName = urlObj.hostname.replace(/[^a-zA-Z0-9-]/g, '-');

    if (urlObj.pathname && urlObj.pathname !== '/') {
      const pathPart = urlObj.pathname
        .replace(/^\/+|\/+$/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-');
      if (pathPart) dirName += '_' + pathPart;
    }

    if (urlObj.search) {
      const queryPart = urlObj.search
        .substring(1)
        .replace(/[^a-zA-Z0-9-_=]/g, '-')
        .substring(0, 50);
      if (queryPart) dirName += '_' + queryPart;
    }

    return dirName;
  }

  async captureScreenshots(url, outputDir = 'screenshots') {
    if (this.browsers.size === 0) {
      throw new Error('No browsers initialized. Call init() first.');
    }

    const urlObj = new URL(url);
    const pageDir = this.createPageDirectoryName(urlObj);
    const timestamp = Date.now();

    for (const [browserName, browser] of this.browsers.entries()) {
      const page = await browser.newPage();

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        if (this.config.hideSelectors.length > 0) {
          await page.addStyleTag({
            content: this.config.hideSelectors
              .map((s) => `${s} { display: none !important; }`)
              .join('\n'),
          });
        }

        await this.pluginManager.runPlugins(page);

        await page.evaluate(async () => {
          const scrollStep = window.innerHeight;
          const maxScroll = document.body.scrollHeight;
          for (let y = 0; y < maxScroll; y += scrollStep) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 300));
          }
          window.scrollTo(0, 0);
        });

        if (this.config.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.config.delay));
        }

        const browserDirPath = path.join(outputDir, browserName, pageDir);
        if (!fs.existsSync(browserDirPath)) {
          fs.mkdirSync(browserDirPath, { recursive: true });
        }

        const metadataPath = path.join(outputDir, browserName, pageDir, '.url');
        if (!fs.existsSync(metadataPath)) {
          fs.writeFileSync(metadataPath, url);
        }

        for (const [breakpointName, width] of Object.entries(this.config.breakpoints)) {
          await page.setViewportSize({ width, height: 1080 });
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const filename = `${breakpointName}_${timestamp}.png`;
          const filepath = path.join(browserDirPath, filename);

          await page.screenshot({ path: filepath, ...this.config.screenshot });

          this.emit('progress', {
            browser: browserName,
            url,
            breakpoint: breakpointName,
            path: `${browserName}/${pageDir}/${filename}`,
          });
        }
      } catch (error) {
        this.emit('error', { url, browser: browserName, message: error.message });
      } finally {
        await page.close();
      }
    }
  }
}

export { Screenshotter };
