import { BaseIntegration } from './base.integration.js';
import { z } from 'zod';

export class SlackIntegration extends BaseIntegration {
  constructor() {
    super();
    this.name = 'slack';
    this.displayName = 'Slack';
    this.description = 'Send messages to Slack channels or users';
    this.icon = 'https://cdn.autoflow.ai/icons/slack.png';
  }

  get configSchema() {
    return z.object({
      botToken: z.string().startsWith('xoxb-', 'Must be a valid Slack bot token'),
    });
  }

  async testConnection(config) {
    // Mocking Slack connection test
    return true;
  }

  getActions() {
    return [
      { id: 'send_message', name: 'Send Channel Message' },
      { id: 'send_dm', name: 'Send DM' },
      { id: 'list_channels', name: 'List Public Channels' }
    ];
  }
}
