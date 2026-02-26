import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export const defaultConfig = {
  plugins: [],
  outputDir: 'screenshots',
  browserOptions: { headless: true },
  screenshot: { fullPage: true },
  breakpoints: {
    'mobile-390px': 390,
    'tablet-768px': 768,
    'desktop-1440px': 1440,
    'large-1920px': 1920,
  },
  concurrency: 3,
  waitUntil: 'load',
  breakpointDelay: 200,
  scrollToLoad: true,
};

export async function loadConfig() {
  const configPath = path.join(process.cwd(), 'silverscreen.config.js');

  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const configUrl = pathToFileURL(configPath).href;
    const userConfigModule = await import(configUrl);
    const userConfig = userConfigModule.default;

    return {
      ...defaultConfig,
      ...userConfig,
      browserOptions: {
        ...defaultConfig.browserOptions,
        ...(userConfig.browserOptions || userConfig.browser || {}),
      },
      screenshot: {
        ...defaultConfig.screenshot,
        ...(userConfig.screenshot || {}),
      },
      breakpoints: userConfig.breakpoints || defaultConfig.breakpoints,
    };
  } catch (error) {
    console.error(`Error loading config file: ${error.message}`);
    return defaultConfig;
  }
}
