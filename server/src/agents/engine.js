import { getToolDefinitions, getTool } from './tools/index.js';
import { buildSystemPrompt, buildUserMessage } from './prompts/agent.prompt.js';
import { logger } from '../utils/logger.util.js';
import { MAX_AGENT_ITERATIONS } from '../config/constants.js';
import { ProviderFactory } from './providers/provider.factory.js';
import { realtimeEmitter } from '../realtime/emitter.js';
import { prisma } from '../config/db.js';

export class AgentEngine {

  async run(executionContext) {
    const { executionId, orgId, aiModel = 'claude', aiConfig = {} } = executionContext;
    const messages = [];
    let iteration = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    const toolResults = [];

    // 1. Initialize Provider
    const provider = ProviderFactory.getProvider(aiModel, aiConfig);

    // 2. Build instructions
    const systemPrompt = buildSystemPrompt(executionContext);
    messages.push({
      role: 'user',
      content: buildUserMessage(executionContext.triggerData)
    });

    logger.info(`Agent starting for execution ${executionId} using ${aiModel}`);

    // Main agent loop
    while (iteration < MAX_AGENT_ITERATIONS) {
      iteration++;
      logger.info(`Agent iteration ${iteration}/${MAX_AGENT_ITERATIONS}`);

      // Emit iteration heartbeat
      realtimeEmitter.emitToExecution(executionId, orgId, 'execution:iteration', { iteration });

      // 3. Model call through Provider
      let response;
      try {
        response = await provider.run(messages, getToolDefinitions(), systemPrompt);
      } catch (error) {
        logger.error(`AI Provider error (${aiModel}):`, error);
        throw new Error(`AI API failed: ${error.message}`);
      }

      // 4. Token tracking
      totalTokensIn += response.usage.promptTokens;
      totalTokensOut += response.usage.completionTokens;

      // 5. Save message to DB (sequence tracking)
      await this.saveMessage(executionId, 'assistant', response.content, iteration);

      // Add assistant response to memory
      messages.push({ role: 'assistant', content: response.content });

      // 6. Handle Stop Reason
      if (response.stopReason === 'end_turn') {
        const textContent = Array.isArray(response.content)
          ? response.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
          : response.content;

        logger.info(`Agent completed after ${iteration} iterations`);

        return {
          success: true,
          output: { 
            message: textContent, 
            toolResults,
            iterations: iteration
          },
          tokensUsed: totalTokensIn + totalTokensOut
        };
      }

      if (response.stopReason === 'tool_use') {
        const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
        const toolResultsForMessage = [];

        for (const toolUse of toolUseBlocks) {
          logger.info(`Executing tool: ${toolUse.name}`, toolUse.input);
          
          // Emit tool_start
          realtimeEmitter.emitToExecution(executionId, orgId, 'execution:tool_start', {
            toolName: toolUse.name,
            input: toolUse.input
          });

          let toolResult;
          try {
            const tool = getTool(toolUse.name);
            toolResult = await tool.execute(toolUse.input, executionContext);
          } catch (error) {
            toolResult = { success: false, error: error.message };
          }

          logger.info(`Tool ${toolUse.name} result captured`);
          toolResults.push({ tool: toolUse.name, input: toolUse.input, result: toolResult });

          // Emit tool_end
          realtimeEmitter.emitToExecution(executionId, orgId, 'execution:tool_end', {
            toolName: toolUse.name,
            output: toolResult
          });

          toolResultsForMessage.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult)
          });
          
          // Save tool interaction to DB
          await this.saveToolMessage(executionId, toolUse, toolResult, iteration);
        }

        // Add tool results to memory
        messages.push({ role: 'user', content: toolResultsForMessage });
      }
    }

    throw new Error(`Max iterations (${MAX_AGENT_ITERATIONS}) reached`);
  }

  async saveMessage(executionId, role, content, sequence) {
    const text = Array.isArray(content) 
      ? content.filter(b => b.type === 'text').map(b => b.text).join('\n')
      : content;
    
    if (!text) return;

    return prisma.agentMessage.create({
      data: { executionId, role, content: text, sequence }
    }).catch(e => logger.error('Failed to save agent message:', e));
  }

  async saveToolMessage(executionId, toolUse, toolResult, sequence) {
    return prisma.agentMessage.create({
      data: {
        executionId,
        role: 'tool',
        content: `Tool result: ${toolUse.name}`,
        toolName: toolUse.name,
        toolInput: toolUse.input,
        toolOutput: toolResult,
        sequence
      }
    }).catch(e => logger.error('Failed to save tool message:', e));
  }
}

export const agentEngine = new AgentEngine();

