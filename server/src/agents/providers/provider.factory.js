import { ClaudeProvider } from './claude.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { logger } from '../../utils/logger.util.js';

export class ProviderFactory {
  /**
   * Get the appropriate provider instance
   * @param {String} model - Model name (claude|gpt-4o|gemini|etc)
   * @param {Object} config - Optional config overrides
   */
  static getProvider(model, config = {}) {
    const modelLower = model.toLowerCase();

    if (modelLower.includes('claude')) {
      return new ClaudeProvider({ ...config, model });
    }

    if (modelLower.includes('gpt') || modelLower.includes('openai')) {
      return new OpenAIProvider({ ...config, model });
    }

    if (modelLower.includes('gemini')) {
      return new GeminiProvider({ ...config, model });
    }

    // Default to Claude
    logger.warn(`Unknown model "${model}", defaulting to Claude provider`);
    return new ClaudeProvider({ ...config, model: 'claude-3-5-sonnet-20241022' });
  }
}
