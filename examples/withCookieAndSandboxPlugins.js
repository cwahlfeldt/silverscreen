import { Screenshotter } from '../src/screenshotter.js';
import { SandboxPlugin, CookiePlugin } from '../src/plugins/index.js';

/**
 * Example: Using built-in Cookie and Sandbox plugins
 *
 * This example demonstrates how to use the Cookie and Sandbox plugins
 * that were originally built into Silverscreen for specific sites.
 *
 * - CookiePlugin: Dismisses cookie banners with .ila-cookieb__close-button selector
 * - SandboxPlugin: Clicks sandbox buttons with .pds-button selector
 */

async function captureWithPlugins() {
  // Create instances of the plugins you want to use
  const cookiePlugin = new CookiePlugin();
  const sandboxPlugin = new SandboxPlugin();

  // Pass plugins to Screenshotter constructor
  const screenshotter = new Screenshotter([cookiePlugin, sandboxPlugin]);

  try {
    await screenshotter.init();

    // Capture screenshots - plugins will run automatically before screenshots
    await screenshotter.captureScreenshots(
      'https://example.com',
      'screenshots'
    );

    await screenshotter.close();
    console.log('\nScreenshots captured successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
captureWithPlugins();

export { captureWithPlugins };
