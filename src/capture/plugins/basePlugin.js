export class BasePlugin {
  constructor(name) {
    this.name = name;
  }

  async handle(_page) {
    return false;
  }

  log(message) {
    console.log(`  [${this.name}] ${message}`);
  }
}
