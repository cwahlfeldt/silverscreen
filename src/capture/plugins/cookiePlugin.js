import { BasePlugin } from './basePlugin.js';

export class CookiePlugin extends BasePlugin {
  constructor() {
    super('Cookie Banner');
  }

  async handle(page) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const cookieButton = await page.$('.ila-cookieb__close-button');
      if (cookieButton) {
        this.log('Found cookie notice, dismissing...');
        await cookieButton.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.log('Cookie notice dismissed');
        return true;
      }
    } catch (error) {
      this.log(`No cookie notice found or dismissal failed: ${error.message}`);
    }
    return false;
  }
}
