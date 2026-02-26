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

// Chromium args to reduce headless detection by Cloudflare and similar services.
const STEALTH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--disable-features=IsolateOrigins,site-per-process',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-infobars',
  '--window-size=1920,1080',
];

class Screenshotter extends EventEmitter {
  constructor(config = {}) {
    super();
    this.browsers = new Map();
    this._captureCounter = 0;

    if (Array.isArray(config)) {
      this.config = {
        plugins: config,
        browsers: ['chromium'],
        browserOptions: { headless: true },
        screenshot: { fullPage: true },
        breakpoints: DEFAULT_BREAKPOINTS,
        hideSelectors: [],
        delay: 0,
        concurrency: 3,
        waitUntil: 'load',
        breakpointDelay: 200,
        scrollToLoad: true,
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
        concurrency: config.concurrency ?? 3,
        waitUntil: config.waitUntil || 'load',
        breakpointDelay: config.breakpointDelay ?? 200,
        scrollToLoad: config.scrollToLoad !== false,
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
        const name = browserName.toLowerCase();
        if (name === 'edge') {
          browserOptions.channel = 'msedge';
        }
        // Apply stealth args for Chromium-based browsers to bypass Cloudflare.
        if (browserEngine === chromium) {
          browserOptions.args = [
            ...(browserOptions.args || []),
            ...STEALTH_ARGS,
          ];
        }
        const browser = await browserEngine.launch(browserOptions);
        this.browsers.set(name, browser);
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

  // Capture all URLs concurrently across all browsers with a concurrency limit.
  async captureAll(urls, outputDir = 'screenshots') {
    if (this.browsers.size === 0) {
      throw new Error('No browsers initialized. Call init() first.');
    }

    const uniqueUrls = [...new Set(urls)];

    const jobs = [];
    for (const url of uniqueUrls) {
      for (const [browserName, browser] of this.browsers.entries()) {
        jobs.push({ url, browserName, browser, outputDir });
      }
    }

    await runConcurrent(
      jobs.map((job) => () => this._captureSingle(job)),
      this.config.concurrency
    );
  }

  // Original single-URL API — preserved for backward compatibility.
  async captureScreenshots(url, outputDir = 'screenshots') {
    if (this.browsers.size === 0) {
      throw new Error('No browsers initialized. Call init() first.');
    }
    for (const [browserName, browser] of this.browsers.entries()) {
      await this._captureSingle({ url, browserName, browser, outputDir });
    }
  }

  // Handles one (url × browser) capture job.
  async _captureSingle({ url, browserName, browser, outputDir }) {
    const urlObj = new URL(url);
    const pageDir = this.createPageDirectoryName(urlObj);
    const timestamp = Date.now();
    const counter = String(++this._captureCounter).padStart(4, '0');

    // Use a realistic user agent for Chromium to avoid headless detection.
    const contextOptions = {};
    if (BROWSER_ENGINES[browserName] === chromium) {
      contextOptions.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    }
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    try {
      // Stealth: mask automation signals before any navigation.
      await page.addInitScript(() => {
        // Hide webdriver flag
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        // Fake plugins array (headless has none)
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        // Fake languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        // Remove chrome.runtime to avoid detection of automation extension
        if (window.chrome) {
          window.chrome.runtime = undefined;
        }
        // Patch permissions query to report 'prompt' instead of 'denied' for notifications
        const origQuery = window.Notification?.permission;
        if (origQuery === 'denied') {
          Object.defineProperty(Notification, 'permission', { get: () => 'default' });
        }
      });

      // Build the hide-selectors CSS once for reuse.
      const hideSelectors = this.config.hideSelectors;
      const hideCSS = hideSelectors.length > 0
        ? hideSelectors
            .map((s) => `${s} { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; max-height: 0 !important; overflow: hidden !important; }`)
            .join('\n')
        : '';

      // addInitScript runs on every navigation (including CF challenge redirects).
      if (hideCSS) {
        await page.addInitScript(({ css, selectors }) => {
          const applyStyle = () => {
            const root = document.head || document.documentElement;
            if (!root) return;
            const style = document.createElement('style');
            style.setAttribute('data-silverscreen-hide', '');
            style.textContent = css;
            root.appendChild(style);
          };
          // Also remove matching elements from the DOM entirely.
          const removeElements = () => {
            selectors.forEach((sel) => {
              document.querySelectorAll(sel).forEach((el) => el.remove());
            });
          };
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => { applyStyle(); removeElements(); }, { once: true });
          } else {
            applyStyle();
            removeElements();
          }
          // Observe for late-arriving elements (e.g. modals injected by JS after load).
          const observer = new MutationObserver(() => removeElements());
          const startObserving = () => observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
          if (document.body) startObserving();
          else document.addEventListener('DOMContentLoaded', startObserving, { once: true });
        }, { css: hideCSS, selectors: hideSelectors });
      }

      await page.goto(url, {
        waitUntil: this.config.waitUntil,
        timeout: 60000,
      });

      // Detect and wait out Cloudflare / challenge pages before proceeding.
      await waitForChallenge(page, this.config.waitUntil);

      // Re-inject hide CSS and remove elements after challenge redirect.
      if (hideCSS) {
        await page.evaluate(({ css, selectors }) => {
          if (!document.querySelector('style[data-silverscreen-hide]')) {
            const style = document.createElement('style');
            style.setAttribute('data-silverscreen-hide', '');
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
          }
          selectors.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => el.remove());
          });
        }, { css: hideCSS, selectors: hideSelectors });
      }

      await this.pluginManager.runPlugins(page);

      if (this.config.scrollToLoad) {
        await page.evaluate(async () => {
          const scrollStep = window.innerHeight;
          const maxScroll = document.body.scrollHeight;
          for (let y = 0; y < maxScroll; y += scrollStep) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 100));
          }
          window.scrollTo(0, 0);
        });
      }

      if (this.config.delay > 0) {
        await page.waitForTimeout(this.config.delay);
      }

      const browserDirPath = path.join(outputDir, browserName, pageDir);
      fs.mkdirSync(browserDirPath, { recursive: true });

      const metadataPath = path.join(browserDirPath, '.url');
      if (!fs.existsSync(metadataPath)) {
        fs.writeFileSync(metadataPath, url);
      }

      for (const [breakpointName, width] of Object.entries(this.config.breakpoints)) {
        await page.setViewportSize({ width, height: 1080 });

        // Wait for layout to stabilize after resize — CSS transitions,
        // resize observers, and lazy-load triggers all need time.
        if (this.config.breakpointDelay > 0) {
          await page.waitForTimeout(this.config.breakpointDelay);
        }
        // Also wait for network to quiet (images triggered by resize).
        await page.waitForLoadState('domcontentloaded').catch(() => {});

        // Ensure hide CSS is still in the DOM and remove elements (SPAs can wipe <head>).
        if (hideCSS) {
          await page.evaluate(({ css, selectors }) => {
            if (!document.querySelector('style[data-silverscreen-hide]')) {
              const style = document.createElement('style');
              style.setAttribute('data-silverscreen-hide', '');
              style.textContent = css;
              (document.head || document.documentElement).appendChild(style);
            }
            selectors.forEach((sel) => {
              document.querySelectorAll(sel).forEach((el) => el.remove());
            });
          }, { css: hideCSS, selectors: hideSelectors });
        }

        const filename = `${breakpointName}_${timestamp}_${counter}.png`;
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
      await context.close();
    }
  }
}

// Zero-dependency sliding-window concurrency pool.
async function runConcurrent(taskFns, limit) {
  const executing = new Set();
  for (const taskFn of taskFns) {
    const p = Promise.resolve().then(taskFn).finally(() => executing.delete(p));
    executing.add(p);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
}

// Wait for Cloudflare or similar interstitial challenge pages to resolve.
// When detected, polls until the challenge clears, then waits for full load.
async function waitForChallenge(page, waitUntil = 'load', timeoutMs = 60000) {
  const isChallenged = async () => {
    try {
      const url = page.url();
      // Cloudflare challenge URLs often contain these paths
      if (/\/cdn-cgi\/(challenge-platform|l\/chk_)/i.test(url)) return true;

      const title = await page.title();
      if (/just a moment|checking your browser|attention required|enable javascript|please wait|verifying|security check/i.test(title)) {
        return true;
      }
      const hasCfElement = await page.evaluate(() => {
        return !!(
          document.getElementById('challenge-running') ||
          document.getElementById('challenge-stage') ||
          document.getElementById('cf-challenge-running') ||
          document.getElementById('cf-spinner-please-wait') ||
          document.getElementById('cf-norobot-container') ||
          document.querySelector('.cf-browser-verification') ||
          document.querySelector('#challenge-form') ||
          document.querySelector('#turnstile-wrapper') ||
          document.querySelector('[class*="challenge"]') ||
          document.querySelector('iframe[src*="challenges.cloudflare.com"]') ||
          // Body with very little content is often a challenge page
          (document.body && document.body.children.length <= 3 &&
            /moment|wait|check/i.test(document.title))
        );
      });
      return hasCfElement;
    } catch {
      // Navigation in progress — treat as still challenged.
      return true;
    }
  };

  if (!(await isChallenged())) return;

  console.log(`  ⏳ Challenge detected on ${page.url()}, waiting…`);

  // Poll until the challenge clears or we time out.
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && (await isChallenged())) {
    // Wait for navigation events that signal the challenge resolved.
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {}),
      page.waitForTimeout(3000),
    ]);
  }

  if (await isChallenged()) {
    console.warn(`  ⚠️  Challenge did not clear within ${timeoutMs / 1000}s on ${page.url()}`);
    return;
  }

  console.log(`  ✅ Challenge cleared on ${page.url()}`);

  // Challenge cleared — wait for the real page to fully settle.
  await page.waitForLoadState(waitUntil).catch(() => {});
  // Extra settle time for JS to finish rendering after challenge redirect.
  await page.waitForTimeout(2000);
  // Also wait for network to quiet down.
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

export { Screenshotter };
