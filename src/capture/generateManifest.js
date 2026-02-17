import fs from 'fs';
import path from 'path';

export function generateManifest(screenshotsDir, outputPath) {
  const absoluteScreenshotsDir = path.resolve(screenshotsDir);

  if (!fs.existsSync(absoluteScreenshotsDir)) {
    return null;
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    browsers: [],
    pages: {},
    screenshots: [],
  };

  const browsersSet = new Set();
  const pagesMap = new Map();

  const browsers = fs.readdirSync(absoluteScreenshotsDir).filter(item => {
    const itemPath = path.join(absoluteScreenshotsDir, item);
    return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
  });

  for (const browser of browsers) {
    browsersSet.add(browser);
    const browserPath = path.join(absoluteScreenshotsDir, browser);

    const pages = fs.readdirSync(browserPath).filter(item => {
      const itemPath = path.join(browserPath, item);
      return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
    });

    for (const page of pages) {
      const pagePath = path.join(browserPath, page);

      const urlFilePath = path.join(pagePath, '.url');
      let pageUrl = null;
      if (fs.existsSync(urlFilePath)) {
        pageUrl = fs.readFileSync(urlFilePath, 'utf-8').trim();
      }

      if (!pagesMap.has(page)) {
        pagesMap.set(page, {
          id: page,
          name: page.replace(/_/g, ' / ').replace(/-/g, '.'),
          url: pageUrl,
          browsers: [],
        });
      }

      const pageInfo = pagesMap.get(page);
      if (!pageInfo.browsers.includes(browser)) {
        pageInfo.browsers.push(browser);
      }
      if (pageUrl && !pageInfo.url) {
        pageInfo.url = pageUrl;
      }

      const files = fs.readdirSync(pagePath).filter(file =>
        file.endsWith('.png') || file.endsWith('.jpg') ||
        file.endsWith('.jpeg') || file.endsWith('.webp')
      );

      for (const file of files) {
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
            extension,
          });
        }
      }
    }
  }

  manifest.browsers = Array.from(browsersSet).sort();
  manifest.pages = Object.fromEntries(
    Array.from(pagesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  );

  manifest.screenshots.sort((a, b) => {
    if (a.page !== b.page) return a.page.localeCompare(b.page);
    if (a.breakpoint !== b.breakpoint) return a.breakpoint.localeCompare(b.breakpoint);
    return a.browser.localeCompare(b.browser);
  });

  const outputDir = path.dirname(path.resolve(outputPath));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.resolve(outputPath), JSON.stringify(manifest, null, 2));

  return manifest;
}
