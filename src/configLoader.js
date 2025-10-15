import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

/**
 * Default configuration
 */
export const defaultConfig = {
  plugins: [],
  outputDir: "screenshots",
  browser: {
    headless: "new",
  },
  screenshot: {
    fullPage: true,
  },
  breakpoints: {
    "mobile-390px": 390,
    "tablet-768px": 768,
    "desktop-1440px": 1440,
    "large-1920px": 1920,
  },
};

/**
 * Load configuration from silverscreen.config.js if it exists
 * Looks in the current working directory
 */
export async function loadConfig() {
  const configPath = path.join(process.cwd(), "silverscreen.config.js");

  // If no config file exists, return default config
  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    // Load the config file using dynamic import
    const configUrl = pathToFileURL(configPath).href;
    const userConfigModule = await import(configUrl);
    const userConfig = userConfigModule.default;

    // Merge with defaults (user config takes precedence)
    const config = {
      ...defaultConfig,
      ...userConfig,
      browser: {
        ...defaultConfig.browser,
        ...(userConfig.browser || {}),
      },
      screenshot: {
        ...defaultConfig.screenshot,
        ...(userConfig.screenshot || {}),
      },
      breakpoints: userConfig.breakpoints || defaultConfig.breakpoints,
    };

    console.log("📝 Loaded configuration from silverscreen.config.js");
    if (config.plugins.length > 0) {
      console.log(
        `   Plugins: ${config.plugins.map((p) => p.name).join(", ")}`
      );
    }

    return config;
  } catch (error) {
    console.error(`⚠️  Error loading config file: ${error.message}`);
    console.log("   Using default configuration");
    return defaultConfig;
  }
}
