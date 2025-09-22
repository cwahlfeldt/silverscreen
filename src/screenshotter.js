const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const BREAKPOINTS = {
  "mobile-390px": 390,
  "tablet-768px": 768,
  "desktop-1440px": 1440,
  "large-1920px": 1920,
};

class Screenshotter {
  constructor() {
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: "new",
    });
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

      // Check for sandbox button and click if present
      await this.handleSandboxButton(page);

      // Create page-specific directory
      const pageDirPath = path.join(outputDir, pageDir);
      if (!fs.existsSync(pageDirPath)) {
        fs.mkdirSync(pageDirPath, { recursive: true });
      }

      for (const [breakpointName, width] of Object.entries(BREAKPOINTS)) {
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
          fullPage: true,
        });

        console.log(`✓ ${breakpointName}: ${pageDir}/${filename}`);
      }
    } catch (error) {
      console.error(`✗ Failed to capture ${url}: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async handleSandboxButton(page) {
    try {
      // Check if sandbox button exists
      const sandboxButton = await page.$(".pds-button");

      if (sandboxButton) {
        console.log("  🔘 Found sandbox button, clicking...");

        // Click the button
        await sandboxButton.click();

        // Wait for navigation to complete
        await page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: 10000,
        });

        console.log("  ✓ Sandbox button clicked, page loaded");

        // After sandbox navigation, check for cookie notice
        await this.handleCookieNotice(page);
      }
    } catch (error) {
      // If no button found or click fails, continue normally
      console.log(
        "  ⚠️  No sandbox button found or click failed, continuing...",
      );
    }

    // Also check for cookie notice on regular pages
    if (!(await page.$(".pds-button"))) {
      await this.handleCookieNotice(page);
    }
  }

  async handleCookieNotice(page) {
    try {
      // Wait a moment for any cookie notices to appear
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if cookie close button exists
      const cookieButton = await page.$(".ila-cookieb__close-button");

      if (cookieButton) {
        console.log("  🍪 Found cookie notice, dismissing...");

        // Click the close button
        await cookieButton.click();

        // Wait a moment for the notice to disappear
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("  ✓ Cookie notice dismissed");
      }
    } catch (error) {
      // If no cookie notice found or click fails, continue normally
      console.log(
        "  ⚠️  No cookie notice found or dismissal failed, continuing...",
      );
    }
  }
}

module.exports = { Screenshotter };
