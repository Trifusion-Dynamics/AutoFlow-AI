import { BaseIntegration } from './base.integration.js';
import { z } from 'zod';

export class GmailIntegration extends BaseIntegration {
  constructor() {
    super();
    this.name = 'gmail';
    this.displayName = 'Gmail';
    this.description = 'Send and receive emails via Gmail';
    this.icon = 'https://cdn.autoflow.ai/icons/gmail.png';
  }

  get configSchema() {
    return z.object({
      user: z.string().email(),
      pass: z.string().min(1, 'App password or API key is required'),
    });
  }

  async testConnection(config) {
    // Mocking Gmail connection test
    logger.info('Testing Gmail connection for', config.user);
    return true;
  }

  getActions() {
    return [
      { id: 'send_email', name: 'Send Email', description: 'Send a plain text or HTML email' },
      { id: 'read_emails', name: 'Read Emails', description: 'Fetch latest emails from inbox' },
      { id: 'search_emails', name: 'Search Emails', description: 'Search emails by query' },
      { id: 'create_draft', name: 'Create Draft', description: 'Create an email draft' }
    ];
  }
}
