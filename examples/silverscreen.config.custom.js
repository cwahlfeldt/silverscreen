import { BasePlugin } from '../src/plugins/basePlugin.js';
import { CookiePlugin } from '../src/plugins/index.js';

/**
 * Custom Silverscreen Configuration with Custom Plugin
 *
 * This example shows how to create and use a custom plugin
 * alongside built-in plugins.
 */

// Define a custom plugin
class MyCustomPlugin extends BasePlugin {
  constructor() {
    super('My Custom Plugin');
  }

  async handle(page) {
    try {
      // Example: Click a modal close button if it exists
      const modalClose = await page.$('[data-modal-close]');

      if (modalClose) {
        this.log('Found modal, closing...');
        await modalClose.click();
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.log('Modal closed');
        return true;
      }
    } catch (error) {
      this.log(`Error: ${error.message}`);
    }

    return false;
  }
}

export default {
  // Define URLs in config instead of using a text file
  urls: [
    'https://example.com',
    'https://example.com/products',
  ],

  plugins: [
    new CookiePlugin(),
    new MyCustomPlugin(),
  ],

  outputDir: 'custom-screenshots',

  // Capture in multiple browsers
  browsers: ['chromium', 'firefox'],

  // Custom breakpoints
  breakpoints: {
    'phone': 375,
    'tablet': 768,
    'desktop': 1920,
  },

  // Screenshot as JPEG with quality setting
  screenshot: {
    fullPage: true,
    type: 'jpeg',
    quality: 85,
  },

  // Browser launch options
  browserOptions: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
};
