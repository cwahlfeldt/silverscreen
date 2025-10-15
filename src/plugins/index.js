export class PluginManager {
  constructor(plugins = []) {
    this.plugins = plugins;
  }

  // Add a custom plugin
  addPlugin(plugin) {
    this.plugins.push(plugin);
  }

  // Run all plugins on a page
  async runPlugins(page) {
    for (const plugin of this.plugins) {
      try {
        await plugin.handle(page);
      } catch (error) {
        console.log(`  ⚠️  Plugin ${plugin.name} failed: ${error.message}`);
      }
    }
  }
}
