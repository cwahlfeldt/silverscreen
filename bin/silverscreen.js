#!/usr/bin/env node

import { Command } from 'commander';
import { readUrlsFromFile } from '../src/urlReader.js';
import { Screenshotter } from '../src/screenshotter.js';
import { loadConfig } from '../src/configLoader.js';

const program = new Command();

program
  .name('silverscreen')
  .description('CLI tool for capturing responsive website screenshots')
  .version('1.0.0')
  .argument('[urls-file]', 'text file containing URLs (one per line) - optional if URLs in config')
  .option('-o, --output <dir>', 'output directory (overrides config)')
  .action(async (urlsFile, options) => {
    try {
      console.log('🎬 Starting Silverscreen...');

      // Load configuration
      const config = await loadConfig();

      // CLI option overrides config
      const outputDir = options.output || config.outputDir;

      // Get URLs from file or config
      let urls = [];
      if (urlsFile) {
        urls = readUrlsFromFile(urlsFile);
        console.log(`📋 Found ${urls.length} valid URLs from file`);
      } else if (config.urls && Array.isArray(config.urls)) {
        urls = config.urls.filter(url => {
          try {
            new URL(url);
            return true;
          } catch {
            console.warn(`⚠️  Invalid URL in config: ${url}`);
            return false;
          }
        });
        console.log(`📋 Found ${urls.length} valid URLs from config`);
      } else {
        console.log('❌ No URLs provided. Either:');
        console.log('   1. Provide a URLs file: silverscreen <urls-file>');
        console.log('   2. Add URLs to silverscreen.config.js');
        process.exit(1);
      }

      if (urls.length === 0) {
        console.log('❌ No valid URLs found');
        process.exit(1);
      }

      const screenshotter = new Screenshotter(config);
      await screenshotter.init();
      console.log('🚀 Browsers initialized');

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n📸 Processing (${i + 1}/${urls.length}): ${url}`);

        await screenshotter.captureScreenshots(url, outputDir);
      }

      await screenshotter.close();
      console.log(`\n✅ Complete! Screenshots saved to ${outputDir}/`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
