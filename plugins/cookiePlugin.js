import { BasePlugin } from "../src/plugins/basePlugin.js";

export class CookiePlugin extends BasePlugin {
  constructor() {
    super("Cookie Banner");
  }

  async handle(page) {
    try {
      // Wait a moment for any cookie notices to appear
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if cookie close button exists
      const cookieButton = await page.$(".ila-cookieb__close-button");

      if (cookieButton) {
        this.log("Found cookie notice, dismissing...");

        // Click the close button
        await cookieButton.click();

        // Wait a moment for the notice to disappear
        await new Promise((resolve) => setTimeout(resolve, 1000));

        this.log("Cookie notice dismissed");
        return true; // Indicate that we handled something
      }
    } catch (error) {
      this.log(`No cookie notice found or dismissal failed: ${error.message}`);
    }

    return false; // Nothing was handled
  }
}
