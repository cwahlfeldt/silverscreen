#!/usr/bin/env node

const { Command } = require('commander');
const { readUrlsFromFile } = require('../src/urlReader');
const { Screenshotter } = require('../src/screenshotter');

const program = new Command();

program
  .name('silverscreen')
  .description('CLI tool for capturing responsive website screenshots')
  .version('1.0.0')
  .argument('<urls-file>', 'text file containing URLs (one per line)')
  .option('-o, --output <dir>', 'output directory', 'screenshots')
  .action(async (urlsFile, options) => {
    try {
      console.log('🎬 Starting Silverscreen...');

      const urls = readUrlsFromFile(urlsFile);
      console.log(`📋 Found ${urls.length} valid URLs to process`);

      if (urls.length === 0) {
        console.log('❌ No valid URLs found in file');
        process.exit(1);
      }

      const screenshotter = new Screenshotter();
      await screenshotter.init();
      console.log('🚀 Browser initialized');

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n📸 Processing (${i + 1}/${urls.length}): ${url}`);

        await screenshotter.captureScreenshots(url, options.output);
      }

      await screenshotter.close();
      console.log(`\n✅ Complete! Screenshots saved to ${options.output}/`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
