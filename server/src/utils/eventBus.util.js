import { EventEmitter } from 'events';

/**
 * Global internal event bus for cross-module communication.
 * Primarily used for SSE and Webhook triggers.
 */
class GlobalEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit for high-concurrency environments
    this.setMaxListeners(100);
  }

  emitExecutionUpdate(orgId, executionId, data) {
    this.emit(`execution:${executionId}`, data);
    this.emit(`org:${orgId}:executions`, { executionId, ...data });
  }

  emitStepUpdate(executionId, stepId, data) {
    this.emit(`execution:${executionId}:step`, { stepId, ...data });
  }
}

export const eventBus = new GlobalEventBus();
