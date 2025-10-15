import { BasePlugin } from "../src/plugins/basePlugin.js";

export class SandboxPlugin extends BasePlugin {
  constructor() {
    super("Sandbox Button");
  }

  async handle(page) {
    try {
      // Check if sandbox button exists
      const sandboxButton = await page.$(".pds-button");

      if (sandboxButton) {
        this.log("Found sandbox button, clicking...");

        // Click the button and wait for navigation
        await Promise.all([
          page.waitForLoadState("networkidle", { timeout: 10000 }),
          sandboxButton.click(),
        ]);

        this.log("Sandbox button clicked, page loaded");
        return true; // Indicate that we handled something
      }
    } catch (error) {
      this.log(`No sandbox button found or click failed: ${error.message}`);
    }

    return false; // Nothing was handled
  }
}
