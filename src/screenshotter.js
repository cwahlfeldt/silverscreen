import { chromium, firefox, webkit } from "playwright";
import fs from "fs";
import path from "path";
import { PluginManager } from "./plugins/index.js";

const DEFAULT_BREAKPOINTS = {
  "mobile-390px": 390,
  "tablet-768px": 768,
  "desktop-1440px": 1440,
  "large-1920px": 1920,
};

const BROWSER_ENGINES = {
  chromium: chromium,
  chrome: chromium,
  firefox: firefox,
  webkit: webkit,
  edge: chromium, // Edge uses Chromium engine
};

class Screenshotter {
  constructor(config = {}) {
    this.browsers = new Map(); // Store multiple browser instances

    // Support legacy plugins array or new config object
    if (Array.isArray(config)) {
      this.config = {
        plugins: config,
        browsers: ["chromium"], // Default to chromium only
        browserOptions: { headless: true },
        screenshot: { fullPage: true },
        breakpoints: DEFAULT_BREAKPOINTS,
      };
    } else {
      this.config = {
        plugins: config.plugins || [],
        browsers: config.browsers || ["chromium"], // Default to chromium
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
    // Launch all configured browsers
    for (const browserName of this.config.browsers) {
      const browserEngine = BROWSER_ENGINES[browserName.toLowerCase()];
      if (!browserEngine) {
        console.warn(`⚠️  Unknown browser: ${browserName}. Supported: chromium, chrome, firefox, webkit, edge`);
        continue;
      }

      try {
        const browserOptions = { ...this.config.browserOptions };

        // For Edge, add the channel option
        if (browserName.toLowerCase() === "edge") {
          browserOptions.channel = "msedge";
        }

        const browser = await browserEngine.launch(browserOptions);
        this.browsers.set(browserName.toLowerCase(), browser);
        console.log(`🌐 Launched ${browserName}`);
      } catch (error) {
        console.error(`✗ Failed to launch ${browserName}: ${error.message}`);
      }
    }

    if (this.browsers.size === 0) {
      throw new Error("No browsers could be launched");
    }
  }

  async close() {
    // Close all browser instances
    for (const [browserName, browser] of this.browsers.entries()) {
      try {
        await browser.close();
        console.log(`🌐 Closed ${browserName}`);
      } catch (error) {
        console.error(`✗ Failed to close ${browserName}: ${error.message}`);
      }
    }
    this.browsers.clear();
  }

  createPageDirectoryName(urlObj) {
    let dirName = urlObj.hostname.replace(/[^a-zA-Z0-9-]/g, "-");

    // Add path if it exists and is meaningful
    if (urlObj.pathname && urlObj.pathname !== "/") {
      const pathPart = urlObj.pathname
        .replace(/^\/+|\/+$/g, "") // Remove leading/trailing slashes
        .replace(/[^a-zA-Z0-9-_]/g, "-") // Replace special chars with dashes
        .replace(/-+/g, "-"); // Collapse multiple dashes

      if (pathPart) {
        dirName += "_" + pathPart;
      }
    }

    // Add query params if they exist (truncated for readability)
    if (urlObj.search) {
      const queryPart = urlObj.search
        .substring(1) // Remove leading ?
        .replace(/[^a-zA-Z0-9-_=]/g, "-")
        .substring(0, 50); // Limit length

      if (queryPart) {
        dirName += "_" + queryPart;
      }
    }

    return dirName;
  }

  async captureScreenshots(url, outputDir = "screenshots") {
    if (this.browsers.size === 0) {
      throw new Error("No browsers initialized. Call init() first.");
    }

    const urlObj = new URL(url);
    const pageDir = this.createPageDirectoryName(urlObj);
    const timestamp = Date.now();

    // Capture screenshots in each browser
    for (const [browserName, browser] of this.browsers.entries()) {
      console.log(`\n📸 Capturing in ${browserName}...`);

      const page = await browser.newPage();

      try {
        await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Inject CSS to hide configured selectors
        if (this.config.hideSelectors.length > 0) {
          await page.addStyleTag({
            content: this.config.hideSelectors
              .map((s) => `${s} { display: none !important; }`)
              .join("\n"),
          });
        }

        // Run all plugins to handle page interactions
        await this.pluginManager.runPlugins(page);

        // Scroll through the page to trigger lazy-loaded images
        await page.evaluate(async () => {
          const scrollStep = window.innerHeight;
          const maxScroll = document.body.scrollHeight;
          for (let y = 0; y < maxScroll; y += scrollStep) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 300));
          }
          window.scrollTo(0, 0);
        });

        // Wait for configured delay (e.g. for images/assets to finish loading)
        if (this.config.delay > 0) {
          console.log(`  ⏳ Waiting ${this.config.delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, this.config.delay));
        }

        // Create browser-specific directory structure: screenshots/browser/page/
        const browserDirPath = path.join(outputDir, browserName, pageDir);
        if (!fs.existsSync(browserDirPath)) {
          fs.mkdirSync(browserDirPath, { recursive: true });
        }

        // Save URL metadata for this page (once per page directory)
        const metadataPath = path.join(outputDir, browserName, pageDir, '.url');
        if (!fs.existsSync(metadataPath)) {
          fs.writeFileSync(metadataPath, url);
        }

        for (const [breakpointName, width] of Object.entries(this.config.breakpoints)) {
          await page.setViewportSize({
            width: width,
            height: 1080,
          });

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const filename = `${breakpointName}_${timestamp}.png`;
          const filepath = path.join(browserDirPath, filename);

          await page.screenshot({
            path: filepath,
            ...this.config.screenshot,
          });

          console.log(`  ✓ ${breakpointName}: ${browserName}/${pageDir}/${filename}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to capture ${url} in ${browserName}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
  }
}

export { Screenshotter };
