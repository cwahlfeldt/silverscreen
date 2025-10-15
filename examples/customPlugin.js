import { BasePlugin } from '../src/plugins/basePlugin.js';
import { Screenshotter } from '../src/screenshotter.js';

// Example: Custom plugin to handle modal dialogs
export class ModalPlugin extends BasePlugin {
  constructor() {
    super('Modal Closer');
  }

  async handle(page) {
    try {
      // Look for modal close buttons
      const modalClose = await page.$('.modal-close, .popup-close, [aria-label="Close"]');

      if (modalClose) {
        this.log('Found modal dialog, closing...');
        await modalClose.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.log('Modal closed');
        return true;
      }
    } catch (error) {
      this.log(`No modal found or close failed: ${error.message}`);
    }

    return false;
  }
}

// Example: How to use custom plugins with Screenshotter
async function exampleUsage() {
  // Create custom plugins
  const modalPlugin = new ModalPlugin();

  // Create screenshotter with custom plugins
  const screenshotter = new Screenshotter([modalPlugin]);

  // Use as normal
  await screenshotter.init();
  await screenshotter.captureScreenshots('https://example.com', 'output');
  await screenshotter.close();
}
