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
  plugins: [
    new CookiePlugin(),
    new MyCustomPlugin(),
  ],

  outputDir: 'custom-screenshots',

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

  // Browser options
  browser: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
};
