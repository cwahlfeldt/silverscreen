// import { CookiePlugin } from "./plugins/cookiePlugin.js";

/**
 * Silverscreen Configuration File
 *
 * Place this file as 'silverscreen.config.js' in your project root
 * to customize Silverscreen's behavior.
 */

export default {
  // URLs to capture (optional - can also use CLI argument with text file)
  urls: [
    "https://adventistreview.ddev.site/",
    "https://adventistreview.ddev.site/world-news/",
    "https://adventistreview.ddev.site/theology/",
    "https://adventistreview.ddev.site/digital-media/",
    "https://adventistreview.ddev.site/world/asia/from-iran-to-gods-ultimate-freedom/",
    "https://adventistreview.ddev.site/the-life-of-faith/hello-again-bill/",
    "https://adventistreview.ddev.site/world/north-america/how-a-runaway-truck-led-me-to-christ/",
    "https://adventistreview.ddev.site/theology/sabbath-school/unity-in-christ-despite-conflicts/",
    "https://adventistreview.ddev.site/growing-faith/keep-on-singing/",
    "https://adventistreview.ddev.site/lifestyle/arts-culture/culture-arts-culture/i-cannot-hate-any-man/",
    "https://adventistreview.ddev.site/world/africa/first-ever-open-heart-surgery-in-malawi-offers-hope-for-millions-of-cardiac-patients/",
    "https://adventistreview.ddev.site/category/lifestyle/arts-culture/",
    "https://adventistreview.ddev.site/category/lifestyle/arts-culture/culture-arts-culture/",
    "https://adventistreview.ddev.site/?s=Culture&asl_active=1&p_asl_data=1&customset[]=world-magazines&customset[]=review-magazines&customset[]=post&asl_gen[]=excerpt&asl_gen[]=content&asl_gen[]=title&qtranslate_lang=0&filters_initial=1&filters_changed=0",
    "https://adventistreview.ddev.site/world-magazine/",
    "https://adventistreview.ddev.site/review-magazine/",
    "https://adventistreview.ddev.site/review-magazine/january-2026/",
  ],

  // Plugins to load (executed in order before each screenshot)
  // plugins: [new CookiePlugin()],

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

  // Delay in ms before taking screenshots (wait for images/assets to load)
  delay: 2000,

  // CSS selectors to hide with display: none !important
  hideSelectors: [
    ".micromodalcontainer",
    ".micromodaloverlay",
    ".micromodal-slide",
  ],

  // Screenshot configuration
  screenshot: {
    fullPage: true,
    // type: 'png', // or 'jpeg' (Playwright also supports 'webp')
    // quality: 90, // for jpeg/webp only
  },

  // Custom breakpoints (optional - defaults to built-in breakpoints if not specified)
  breakpoints: {
    "mobile-390px": 390,
    "tablet-768px": 768,
    "medium-1024px": 1024,
    "desktop-1440px": 1440,
    "large-1920px": 1920,
  },
};
