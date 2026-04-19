export class BaseIntegration {
  constructor() {
    this.name = 'base';
    this.displayName = 'Base Integration';
    this.description = '';
    this.icon = '';
  }

  /**
   * Zod schema for credential validation
   */
  get configSchema() {
    throw new Error('configSchema not implemented');
  }

  /**
   * Verify credentials by making a test API call
   */
  async testConnection(config) {
    throw new Error('testConnection not implemented');
  }

  /**
   * List available actions for this integration
   */
  getActions() {
    throw new Error('getActions not implemented');
  }
}
