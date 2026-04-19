import { GmailIntegration } from './gmail.integration.js';
import { SlackIntegration } from './slack.integration.js';
import { NotionIntegration } from './notion.integration.js';

class IntegrationRegistry {
  constructor() {
    this.integrations = new Map();
    this.register(new GmailIntegration());
    this.register(new SlackIntegration());
    this.register(new NotionIntegration());
  }

  register(integration) {
    this.integrations.set(integration.name, integration);
  }

  get(name) {
    return this.integrations.get(name);
  }

  getAll() {
    return Array.from(this.integrations.values());
  }
}

export const integrationRegistry = new IntegrationRegistry();
