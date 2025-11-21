import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a manifest.json file by scanning the screenshots directory
 * Structure: screenshots/browser/site-page/breakpoint_timestamp.png
 */
export function generateManifest(screenshotsDir = "screenshots", outputPath = "viewer/public/manifest.json") {
  const absoluteScreenshotsDir = path.resolve(screenshotsDir);

  if (!fs.existsSync(absoluteScreenshotsDir)) {
    console.log(`⚠️  Screenshots directory not found: ${absoluteScreenshotsDir}`);
    return null;
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    browsers: [],
    pages: {},
    screenshots: []
  };

  const browsersSet = new Set();
  const pagesMap = new Map();

  // Read browser directories
  const browsers = fs.readdirSync(absoluteScreenshotsDir).filter(item => {
    const itemPath = path.join(absoluteScreenshotsDir, item);
    return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
  });

  for (const browser of browsers) {
    browsersSet.add(browser);
    const browserPath = path.join(absoluteScreenshotsDir, browser);

    // Read page directories
    const pages = fs.readdirSync(browserPath).filter(item => {
      const itemPath = path.join(browserPath, item);
      return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
    });

    for (const page of pages) {
      const pagePath = path.join(browserPath, page);

      // Read URL from metadata file if it exists
      const urlFilePath = path.join(pagePath, '.url');
      let pageUrl = null;
      if (fs.existsSync(urlFilePath)) {
        pageUrl = fs.readFileSync(urlFilePath, 'utf-8').trim();
      }

      // Store page info
      if (!pagesMap.has(page)) {
        pagesMap.set(page, {
          id: page,
          name: page.replace(/_/g, ' / ').replace(/-/g, '.'),
          url: pageUrl,
          browsers: []
        });
      }

      const pageInfo = pagesMap.get(page);
      if (!pageInfo.browsers.includes(browser)) {
        pageInfo.browsers.push(browser);
      }
      // Update URL if we found it and it wasn't set yet
      if (pageUrl && !pageInfo.url) {
        pageInfo.url = pageUrl;
      }

      // Read screenshot files
      const files = fs.readdirSync(pagePath).filter(file =>
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp')
      );

      for (const file of files) {
        // Parse filename: breakpoint_timestamp.ext
        const match = file.match(/^(.+?)_(\d+)\.(png|jpg|jpeg|webp)$/);
        if (match) {
          const [, breakpoint, timestamp, extension] = match;

          manifest.screenshots.push({
            browser,
            page,
            pageName: page.replace(/_/g, ' / ').replace(/-/g, '.'),
            breakpoint,
            timestamp: parseInt(timestamp, 10),
            filename: file,
            path: `screenshots/${browser}/${page}/${file}`,
            extension
          });
        }
      }
    }
  }

  manifest.browsers = Array.from(browsersSet).sort();
  manifest.pages = Object.fromEntries(
    Array.from(pagesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  );

  // Sort screenshots by page, breakpoint, browser
  manifest.screenshots.sort((a, b) => {
    if (a.page !== b.page) return a.page.localeCompare(b.page);
    if (a.breakpoint !== b.breakpoint) return a.breakpoint.localeCompare(b.breakpoint);
    return a.browser.localeCompare(b.browser);
  });

  // Ensure output directory exists
  const outputDir = path.dirname(path.resolve(outputPath));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write manifest
  fs.writeFileSync(path.resolve(outputPath), JSON.stringify(manifest, null, 2));

  console.log(`\n📋 Manifest generated:`);
  console.log(`   Browsers: ${manifest.browsers.join(', ')}`);
  console.log(`   Pages: ${Object.keys(manifest.pages).length}`);
  console.log(`   Screenshots: ${manifest.screenshots.length}`);
  console.log(`   Output: ${outputPath}`);

  return manifest;
}

/**
 * Copies screenshots to the viewer public directory
 */
export function copyScreenshots(screenshotsDir = "screenshots", viewerPublicDir = "viewer/public") {
  const absoluteScreenshotsDir = path.resolve(screenshotsDir);
  const absoluteViewerPublicDir = path.resolve(viewerPublicDir);
  const targetDir = path.join(absoluteViewerPublicDir, 'screenshots');

  if (!fs.existsSync(absoluteScreenshotsDir)) {
    console.log(`⚠️  Screenshots directory not found: ${absoluteScreenshotsDir}`);
    return;
  }

  // Remove existing screenshots in viewer
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Copy screenshots directory
  copyDir(absoluteScreenshotsDir, targetDir);

  console.log(`\n📁 Screenshots copied to: ${path.relative(process.cwd(), targetDir)}`);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const screenshotsDir = process.argv[2] || "screenshots";
  const outputPath = process.argv[3] || "viewer/public/manifest.json";

  console.log(`\n🔍 Scanning screenshots directory: ${screenshotsDir}`);

  generateManifest(screenshotsDir, outputPath);
  copyScreenshots(screenshotsDir, "viewer/public");

  console.log(`\n✅ Done!\n`);
}
