import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider } from './base.provider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.util.js';

export class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.modelName = config.model || 'gemini-1.5-pro';
  }

  async run(messages, tools, systemPrompt) {
    // 1. Convert tools to Gemini format
    const geminiTools = tools.length > 0 ? [{
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.input_schema
      }))
    }] : [];

    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      systemInstruction: systemPrompt,
      tools: geminiTools
    });

    // 2. Map history
    const history = messages.slice(0, -1).map(m => {
      if (m.role === 'user') return { role: 'user', parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }] };
      if (m.role === 'assistant') return { role: 'model', parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }] };
      return { role: 'user', parts: [{ text: JSON.stringify(m.content) }] };
    });

    const lastMessage = messages[messages.length - 1];
    const userPrompt = typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userPrompt);
      const response = await result.response;
      const candidates = response.candidates[0];
      
      const content = [];
      let stopReason = 'end_turn';

      candidates.content.parts.forEach(part => {
        if (part.text) {
          content.push({ type: 'text', text: part.text });
        }
        if (part.functionCall) {
          content.push({
            type: 'tool_use',
            id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: part.functionCall.name,
            input: part.functionCall.args
          });
          stopReason = 'tool_use';
        }
      });

      return this.formatResponse(
        content,
        stopReason,
        {
          input_tokens: response.usageMetadata?.promptTokenCount || 0,
          output_tokens: response.usageMetadata?.candidatesTokenCount || 0
        }
      );
    } catch (error) {
      logger.error('Gemini Provider Error:', error);
      throw error;
    }
  }
}
