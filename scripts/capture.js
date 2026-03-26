const { chromium, firefox, webkit } = require("playwright");
const path = require("path");
const fs = require("fs");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    args[key] = argv[i + 1];
  }
  return {
    urls: JSON.parse(args.urls || "[]"),
    browsers: JSON.parse(args.browsers || '["chromium"]'),
    viewports: JSON.parse(args.viewports || '["1920x1080"]'),
    delay: parseInt(args.delay || "0", 10),
    output: args.output || "./screenshots",
    hide: JSON.parse(args.hide || "[]"),
  };
}

function sanitizeUrl(url) {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .slice(0, 80);
}

const browserLaunchers = {
  chromium,
  firefox,
  webkit,
};

async function main() {
  const { urls, browsers, viewports, delay, output } = parseArgs(process.argv);

  fs.mkdirSync(output, { recursive: true });

  // Write a URL mapping file so the Flutter app can reconstruct URLs from filenames
  const urlMap = {};

  for (const browserName of browsers) {
    const launcher = browserLaunchers[browserName];
    if (!launcher) {
      console.log(
        JSON.stringify({
          status: "error",
          browser: browserName,
          url: "",
          viewport: "",
          error: `Unknown browser: ${browserName}`,
        }),
      );
      continue;
    }

    let browser;
    try {
      browser = await launcher.launch();
    } catch (err) {
      // Emit error for every url/viewport combo since the browser won't launch
      for (const vp of viewports) {
        for (const url of urls) {
          console.log(
            JSON.stringify({
              status: "error",
              url,
              browser: browserName,
              viewport: vp,
              error: `Failed to launch ${browserName}: ${err.message}`,
            }),
          );
        }
      }
      continue;
    }

    for (const vp of viewports) {
      const [width, height] = vp.split("x").map(Number);

      const context = await browser.newContext({
        viewport: { width, height },
      });

      for (const url of urls) {
        const sanitized = sanitizeUrl(url);
        const filename = `${sanitized}_${browserName}_${vp}.png`;
        const filepath = path.join(output, filename);

        urlMap[sanitized] = url;

        try {
          const page = await context.newPage();
          await page.goto(url, {
            waitUntil: "load",
            timeout: 30000,
          });

          if (delay > 0) {
            await page.waitForTimeout(delay);
          }

          const selectorsToHide = [
            ".ad-banner",
            "#cookie-consent",
            "header.sticky",
            ".micromodal",
            "#consent-banner",
          ];

          if (selectorsToHide.length > 0) {
            await page.addStyleTag({
              content: `${selectorsToHide.join(", ")} { display: none !important; }`,
            });
          }

          await page.screenshot({ path: filepath, fullPage: true });
          await page.close();

          console.log(
            JSON.stringify({
              status: "done",
              url,
              browser: browserName,
              viewport: vp,
              path: filepath,
            }),
          );
        } catch (err) {
          console.log(
            JSON.stringify({
              status: "error",
              url,
              browser: browserName,
              viewport: vp,
              error: err.message,
            }),
          );
        }
      }

      await context.close();
    }

    await browser.close();
  }

  // Save URL mapping for the Flutter app
  fs.writeFileSync(
    path.join(output, "_url_map.json"),
    JSON.stringify(urlMap, null, 2),
  );

  console.log(JSON.stringify({ status: "complete" }));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
