import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentEngine } from '../../src/agents/engine.js';
import { ProviderFactory } from '../../src/agents/providers/provider.factory.js';
import { realtimeEmitter } from '../../src/realtime/emitter.js';
import { prisma } from '../../src/config/db.js';
import * as tools from '../../src/agents/tools/index.js';

vi.mock('../../src/agents/providers/provider.factory.js');
vi.mock('../../src/realtime/emitter.js');
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    agentMessage: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));
vi.mock('../../src/agents/tools/index.js');

describe('AgentEngine Unit Tests', () => {
  const mockContext = {
    executionId: 'ex-1',
    orgId: 'org-1',
    aiModel: 'claude',
    triggerData: { input: 'hello' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run successfully and return end_turn response', async () => {
    const mockProvider = {
      run: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Hello, I am an assistant.' }],
        stopReason: 'end_turn',
        usage: { promptTokens: 10, completionTokens: 5 }
      })
    };
    ProviderFactory.getProvider.mockReturnValue(mockProvider);

    const result = await agentEngine.run(mockContext);

    expect(result.success).toBe(true);
    expect(result.output.message).toBe('Hello, I am an assistant.');
    expect(result.tokensUsed).toBe(15);
    expect(prisma.agentMessage.create).toHaveBeenCalled();
  });

  it('should execute tool when stopReason is tool_use', async () => {
    const mockProvider = {
      run: vi.fn()
        .mockResolvedValueOnce({
          content: [
            { type: 'text', text: 'I need to check the weather.' },
            { type: 'tool_use', name: 'get_weather', input: { city: 'London' }, id: 'tool-1' }
          ],
          stopReason: 'tool_use',
          usage: { promptTokens: 10, completionTokens: 5 }
        })
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: 'It is sunny in London.' }],
          stopReason: 'end_turn',
          usage: { promptTokens: 5, completionTokens: 5 }
        })
    };
    ProviderFactory.getProvider.mockReturnValue(mockProvider);
    
    const mockTool = {
      execute: vi.fn().mockResolvedValue({ temp: 20 })
    };
    tools.getTool.mockReturnValue(mockTool);

    const result = await agentEngine.run(mockContext);

    expect(result.success).toBe(true);
    expect(result.output.toolResults).toHaveLength(1);
    expect(result.output.toolResults[0].tool).toBe('get_weather');
    expect(mockTool.execute).toHaveBeenCalled();
    expect(realtimeEmitter.emitToExecution).toHaveBeenCalledWith('ex-1', 'org-1', 'execution:tool_start', expect.anything());
  });

  it('should throw error when AI API fails', async () => {
    const mockProvider = {
      run: vi.fn().mockRejectedValue(new Error('API Down'))
    };
    ProviderFactory.getProvider.mockReturnValue(mockProvider);

    await expect(agentEngine.run(mockContext)).rejects.toThrow('AI API failed: API Down');
  });
});
