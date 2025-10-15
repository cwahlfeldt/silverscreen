import { CookiePlugin, SandboxPlugin } from '../src/plugins/index.js';

/**
 * Silverscreen Configuration File
 *
 * Place this file as 'silverscreen.config.js' in your project root
 * to customize Silverscreen's behavior.
 */

export default {
  // Plugins to load (executed in order before each screenshot)
  plugins: [
    new CookiePlugin(),
    new SandboxPlugin(),
  ],

  // Default output directory
  outputDir: 'screenshots',

  // Browser configuration
  browser: {
    headless: 'new',
    // Add any other Puppeteer launch options here
    // args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  // Screenshot configuration
  screenshot: {
    fullPage: true,
    // type: 'png', // or 'jpeg'
    // quality: 90, // for jpeg only
  },

  // Custom breakpoints (optional - defaults to built-in breakpoints if not specified)
  // breakpoints: {
  //   'mobile-390px': 390,
  //   'tablet-768px': 768,
  //   'desktop-1440px': 1440,
  //   'large-1920px': 1920,
  // },
};
