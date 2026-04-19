import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.provider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.util.js';

export class ClaudeProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    this.modelName = config.model || 'claude-3-5-sonnet-20241022';
  }

  async run(messages, tools, systemPrompt) {
    try {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature || 0.7,
        system: systemPrompt,
        tools: tools,
        messages: messages
      });

      const stopReason = response.stop_reason === 'tool_use' ? 'tool_use' : 'end_turn';
      
      return this.formatResponse(
        response.content,
        stopReason,
        response.usage
      );
    } catch (error) {
      logger.error('Claude Provider Error:', error);
      throw error;
    }
  }
}
