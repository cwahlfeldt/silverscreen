// const { CookiePlugin, SandboxPlugin } = require("./plugins");
import { CookiePlugin } from "./plugins/cookiePlugin.js";
import { SandboxPlugin } from "./plugins/sandboxPlugin.js";

/**
 * Silverscreen Configuration File
 *
 * Place this file as 'silverscreen.config.js' in your project root
 * to customize Silverscreen's behavior.
 */

export default {
  // Plugins to load (executed in order before each screenshot)
  plugins: [new SandboxPlugin(), new CookiePlugin()],

  // Default output directory
  outputDir: "screenshots",

  // Browsers to use for screenshots
  // Supported: 'chromium', 'chrome', 'firefox', 'webkit', 'edge'
  // Output structure: screenshots/browser-name/site-page/breakpoint.png
  browsers: ["chromium", "firefox", "webkit"],

  // Browser launch options (applies to all browsers)
  browserOptions: {
    headless: true,
    // Add any other Playwright launch options here
    // args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  // Screenshot configuration
  screenshot: {
    fullPage: true,
    // type: 'png', // or 'jpeg' (Playwright also supports 'webp')
    // quality: 90, // for jpeg/webp only
  },

  // Custom breakpoints (optional - defaults to built-in breakpoints if not specified)
  // breakpoints: {
  //   'mobile-390px': 390,
  //   'tablet-768px': 768,
  //   'desktop-1440px': 1440,
  //   'large-1920px': 1920,
  // },
};
