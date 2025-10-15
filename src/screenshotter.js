import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { PluginManager } from "./plugins/index.js";

const DEFAULT_BREAKPOINTS = {
  "mobile-390px": 390,
  "tablet-768px": 768,
  "desktop-1440px": 1440,
  "large-1920px": 1920,
};

class Screenshotter {
  constructor(config = {}) {
    this.browser = null;

    // Support legacy plugins array or new config object
    if (Array.isArray(config)) {
      this.config = {
        plugins: config,
        browser: { headless: "new" },
        screenshot: { fullPage: true },
        breakpoints: DEFAULT_BREAKPOINTS,
      };
    } else {
      this.config = {
        plugins: config.plugins || [],
        browser: config.browser || { headless: "new" },
        screenshot: config.screenshot || { fullPage: true },
        breakpoints: config.breakpoints || DEFAULT_BREAKPOINTS,
      };
    }

    this.pluginManager = new PluginManager(this.config.plugins);
  }

  async init() {
    this.browser = await puppeteer.launch(this.config.browser);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
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
    if (!this.browser) {
      throw new Error("Browser not initialized. Call init() first.");
    }

    const page = await this.browser.newPage();
    const urlObj = new URL(url);
    const pageDir = this.createPageDirectoryName(urlObj);
    const timestamp = Date.now();

    try {
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Run all plugins to handle page interactions
      await this.pluginManager.runPlugins(page);

      // Create page-specific directory
      const pageDirPath = path.join(outputDir, pageDir);
      if (!fs.existsSync(pageDirPath)) {
        fs.mkdirSync(pageDirPath, { recursive: true });
      }

      for (const [breakpointName, width] of Object.entries(this.config.breakpoints)) {
        await page.setViewport({
          width: width,
          height: 1080,
          deviceScaleFactor: 1,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const filename = `${breakpointName}_${timestamp}.png`;
        const filepath = path.join(pageDirPath, filename);

        await page.screenshot({
          path: filepath,
          ...this.config.screenshot,
        });

        console.log(`✓ ${breakpointName}: ${pageDir}/${filename}`);
      }
    } catch (error) {
      console.error(`✗ Failed to capture ${url}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
}

export { Screenshotter };
