/**
 * Base AI Provider Class
 */
export class BaseProvider {
  /**
   * @param {Object} config - Provider specific config (API keys, etc.)
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Run the AI model with messages and tools
   * @param {Array} messages - Chat message history
   * @param {Array} tools - Available tool definitions
   * @param {String} systemPrompt - Optional system instructions
   * @returns {Promise<Object>} - Standardized response format
   */
  async run(messages, tools, systemPrompt) {
    throw new Error('Method "run" must be implemented by concrete provider');
  }

  /**
   * Standardize the output format across different providers
   */
  formatResponse(content, stopReason, usage) {
    return {
      content,      // String or tool call array
      stopReason,   // 'end_turn' | 'tool_use' | 'max_tokens'
      usage: {
        promptTokens: usage.input_tokens || usage.prompt_tokens || 0,
        completionTokens: usage.output_tokens || usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || (usage.input_tokens + usage.output_tokens) || 0
      }
    };
  }
}
