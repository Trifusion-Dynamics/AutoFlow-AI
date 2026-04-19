import { BaseIntegration } from './base.integration.js';
import { z } from 'zod';

export class NotionIntegration extends BaseIntegration {
  constructor() {
    super();
    this.name = 'notion';
    this.displayName = 'Notion';
    this.description = 'Interact with Notion databases and pages';
    this.icon = 'https://cdn.autoflow.ai/icons/notion.png';
  }

  get configSchema() {
    return z.object({
      apiKey: z.string().startsWith('secret_', 'Must be a valid Notion internal integration token'),
    });
  }

  async testConnection(config) {
    return true;
  }

  getActions() {
    return [
      { id: 'create_page', name: 'Create Page' },
      { id: 'update_page', name: 'Update Page' },
      { id: 'query_database', name: 'Query Database' }
    ];
  }
}
