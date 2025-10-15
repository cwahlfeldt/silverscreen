export class BasePlugin {
  constructor(name) {
    this.name = name;
  }

  // Override this method in your plugin
  async handle(page) {
    // Default implementation does nothing
    return false;
  }

  // Helper method for logging
  log(message) {
    console.log(`  🔌 [${this.name}] ${message}`);
  }
}
