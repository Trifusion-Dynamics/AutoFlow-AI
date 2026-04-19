import OpenAI from 'openai';
import { BaseProvider } from './base.provider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.util.js';

export class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.modelName = config.model || 'gpt-4o';
  }

  async run(messages, tools, systemPrompt) {
    // 1. Convert Claude-style tools to OpenAI functions
    const functions = tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema
      }
    }));

    // 2. Prepare messages (OpenAI includes system as a message)
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => {
        // Standardize roles
        let role = m.role;
        if (role === 'assistant' && typeof m.content === 'object') {
           // Handle Claude tool block format
           return {
             role: 'assistant',
             tool_calls: m.content.filter(b => b.type === 'tool_use').map(b => ({
               id: b.id,
               type: 'function',
               function: { name: b.name, arguments: JSON.stringify(b.input) }
             })),
             content: m.content.filter(b => b.type === 'text').map(b => b.text).join('\n') || null
           };
        }
        if (role === 'user' && Array.isArray(m.content)) {
          // Handle Claude tool result blocks
          return m.content.map(b => {
            if (b.type === 'tool_result') {
              return {
                role: 'tool',
                tool_call_id: b.tool_use_id,
                content: b.content
              };
            }
            return { role: 'user', content: b.text };
          });
        }
        return m;
      }).flat()
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: apiMessages,
        tools: functions,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 4096,
      });

      const choice = response.choices[0];
      const message = choice.message;

      // Standardize response back to Claude-like format for the engine
      const content = [];
      if (message.content) {
        content.push({ type: 'text', text: message.content });
      }
      
      if (message.tool_calls) {
        message.tool_calls.forEach(tc => {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments)
          });
        });
      }

      const stopReason = choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn';

      return this.formatResponse(
        content,
        stopReason,
        {
          input_tokens: response.usage.prompt_tokens,
          output_tokens: response.usage.completion_tokens
        }
      );
    } catch (error) {
      logger.error('OpenAI Provider Error:', error);
      throw error;
    }
  }
}
