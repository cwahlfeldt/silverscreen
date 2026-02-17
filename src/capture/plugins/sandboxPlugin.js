import { BasePlugin } from './basePlugin.js';

export class SandboxPlugin extends BasePlugin {
  constructor() {
    super('Sandbox Button');
  }

  async handle(page) {
    try {
      await page.waitForSelector('.micromodalcontainer', {
        state: 'visible',
        timeout: 15000,
      });
      this.log('Found modal, removing from DOM...');
      await page.evaluate(() => {
        document.querySelectorAll('.micromodalcontainer, .micromodaloverlay, .micromodal-slide').forEach(el => el.remove());
        const style = document.createElement('style');
        style.textContent = '.micromodalcontainer, .micromodaloverlay, .micromodal-slide { display: none !important; }';
        document.head.appendChild(style);
      });
      this.log('Modal removed');
      return true;
    } catch (error) {
      this.log(`No modal appeared: ${error.message}`);
    }
    return false;
  }
}
