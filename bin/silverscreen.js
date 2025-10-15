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
  .argument('<urls-file>', 'text file containing URLs (one per line)')
  .option('-o, --output <dir>', 'output directory (overrides config)')
  .action(async (urlsFile, options) => {
    try {
      console.log('🎬 Starting Silverscreen...');

      // Load configuration
      const config = await loadConfig();

      // CLI option overrides config
      const outputDir = options.output || config.outputDir;

      const urls = readUrlsFromFile(urlsFile);
      console.log(`📋 Found ${urls.length} valid URLs to process`);

      if (urls.length === 0) {
        console.log('❌ No valid URLs found in file');
        process.exit(1);
      }

      const screenshotter = new Screenshotter(config);
      await screenshotter.init();
      console.log('🚀 Browser initialized');

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
