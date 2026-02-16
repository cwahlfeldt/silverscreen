import { BasePlugin } from "../src/plugins/basePlugin.js";

export class SandboxPlugin extends BasePlugin {
  constructor() {
    super("Sandbox Button");
  }

  async handle(page) {
    try {
      // Wait for the modal to appear (it shows on a delay after page load)
      await page.waitForSelector(".micromodalcontainer", {
        state: "visible",
        timeout: 15000,
      });

      this.log("Found modal, removing from DOM...");

      // Remove the modal and prevent it from reappearing
      await page.evaluate(() => {
        document.querySelectorAll(".micromodalcontainer, .micromodaloverlay, .micromodal-slide").forEach(el => el.remove());

        // Add style to keep it hidden if the site tries to re-inject it
        const style = document.createElement("style");
        style.textContent = ".micromodalcontainer, .micromodaloverlay, .micromodal-slide { display: none !important; }";
        document.head.appendChild(style);
      });

      this.log("Modal removed");
      return true;
    } catch (error) {
      this.log(`No modal appeared: ${error.message}`);
    }

    return false;
  }
}
