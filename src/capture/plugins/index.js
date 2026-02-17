export class PluginManager {
  constructor(plugins = []) {
    this.plugins = plugins;
  }

  addPlugin(plugin) {
    this.plugins.push(plugin);
  }

  async runPlugins(page) {
    for (const plugin of this.plugins) {
      try {
        await plugin.handle(page);
      } catch (error) {
        console.log(`  Plugin ${plugin.name} failed: ${error.message}`);
      }
    }
  }
}

export { BasePlugin } from './basePlugin.js';
export { CookiePlugin } from './cookiePlugin.js';
export { SandboxPlugin } from './sandboxPlugin.js';
