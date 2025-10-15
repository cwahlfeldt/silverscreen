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
  // URLs to capture (optional - can also use CLI argument with text file)
  urls: [
    "https://dev-otm-2025.pantheonsite.io/",
    // "https://dev-otm-2025.pantheonsite.io/researchers-innovators/understanding-intellectual-property",
    // "https://dev-otm-2025.pantheonsite.io/researchers-innovators/report-your-innovation",
    // "https://dev-otm-2025.pantheonsite.io/researchers-innovators/transferring-research-beyond-academia",
    // "https://dev-otm-2025.pantheonsite.io/researchers-innovators/resources-support-innovators",
    // "https://dev-otm-2025.pantheonsite.io/researchers-innovators/request-thesis-withhold",
    // "https://dev-otm-2025.pantheonsite.io/browse-technologies-startups",
    // "https://dev-otm-2025.pantheonsite.io/browse-technologies-startups/technologies",
    // "https://dev-otm-2025.pantheonsite.io/browse-technologies-startups/healthcare-pipeline",
    // "https://dev-otm-2025.pantheonsite.io/browse-technologies-startups/startups",
    // "https://dev-otm-2025.pantheonsite.io/industry-partners/licensee-reporting-center",
    // "https://dev-otm-2025.pantheonsite.io/industry-partners/engage-our-research-enterprise",
    // "https://dev-otm-2025.pantheonsite.io/industry-partners/request-permission-use-copyrighted-material",
    // "https://dev-otm-2025.pantheonsite.io/browse-technologies-startups/technologies",
    // "https://dev-otm-2025.pantheonsite.io/about",
    // "https://dev-otm-2025.pantheonsite.io/about/our-team",
    // "https://dev-otm-2025.pantheonsite.io/about/events",
    // "https://dev-otm-2025.pantheonsite.io/browse-technologies-startups/technologies/122/distributed-feedback-laser-biosensortf07135",
    // "https://dev-otm-2025.pantheonsite.io/about/contact",
  ],

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
