#!/usr/bin/env node

import { Command } from 'commander';
import { readUrlsFromFile } from '../src/capture/urlReader.js';
import { Screenshotter } from '../src/capture/screenshotter.js';
import { loadConfig } from '../src/capture/configLoader.js';
import { generateManifest } from '../src/capture/generateManifest.js';
import { startServer } from '../src/server/index.js';
import {
  createSession,
  getSessionScreenshotsDir,
  generateSessionManifest,
} from '../src/server/sessionManager.js';

const program = new Command();

program
  .name('silverscreen')
  .description('Capture and compare responsive screenshots')
  .version('2.0.0');

// Default: start the unified UI server
program
  .command('serve', { isDefault: true })
  .description('Start the Silverscreen web UI (default)')
  .option('-p, --port <port>', 'server port', '3001')
  .action((options) => {
    startServer(parseInt(options.port, 10));
  });

// Headless capture command
program
  .command('capture [urls-file]')
  .description('Capture screenshots from the command line (headless)')
  .option('-o, --output <dir>', 'output directory (overrides config)')
  .option('-n, --name <name>', 'session name')
  .action(async (urlsFile, options) => {
    try {
      console.log('Starting Silverscreen capture...');

      const config = await loadConfig();
      const outputDir = options.output || config.outputDir || 'screenshots';

      let urls = [];
      if (urlsFile) {
        urls = readUrlsFromFile(urlsFile);
        console.log(`Found ${urls.length} valid URLs from file`);
      } else if (config.urls && Array.isArray(config.urls)) {
        urls = config.urls.filter((url) => {
          try { new URL(url); return true; }
          catch { console.warn(`Invalid URL in config: ${url}`); return false; }
        });
        console.log(`Found ${urls.length} valid URLs from config`);
      } else {
        console.error('No URLs provided. Use a URLs file or add URLs to silverscreen.config.js');
        process.exit(1);
      }

      if (urls.length === 0) {
        console.error('No valid URLs found');
        process.exit(1);
      }

      // Create a session to store results in data/
      const sessionName = options.name || (() => {
        try {
          return `${new URL(urls[0]).hostname} ${new Date().toLocaleDateString()}`;
        } catch (_) {
          return `Session ${new Date().toLocaleDateString()}`;
        }
      })();

      const session = createSession({
        name: sessionName,
        urls,
        browsers: config.browsers || ['chromium'],
        breakpoints: config.breakpoints,
      });

      const screenshotsDir = getSessionScreenshotsDir(session.id);

      const screenshotter = new Screenshotter(config);
      screenshotter.on('progress', (e) => {
        console.log(`  [${e.browser}] ${e.breakpoint} — ${e.url}`);
      });
      screenshotter.on('error', (e) => {
        console.error(`  Error [${e.browser}] ${e.url}: ${e.message}`);
      });

      await screenshotter.init();

      console.log(`\nCapturing ${urls.length} URL(s) across ${(config.browsers || ['chromium']).length} browser(s) [concurrency: ${config.concurrency ?? 3}]...`);
      await screenshotter.captureAll(urls, screenshotsDir);

      await screenshotter.close();

      console.log('\nGenerating manifest...');
      generateSessionManifest(session.id);

      // Also generate a legacy manifest in the old location for any tools that expect it
      generateManifest(screenshotsDir, `${outputDir}/manifest.json`);

      console.log(`\nDone! Session "${session.name}" saved.`);
      console.log(`Run 'silverscreen serve' or 'npm start' to view in the browser.`);

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
