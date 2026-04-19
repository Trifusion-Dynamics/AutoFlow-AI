import { logger } from './logger.util.js';

/**
 * agentLogger for dedicated AI execution logging
 */
export const agentLogger = {
  /**
   * Log Claude API interaction
   */
  logApiCall: (data) => {
    logger.debug({
      label: 'agent',
      type: 'api_call',
      ...data
    });
  },

  /**
   * Log Tool usage
   */
  logToolCall: (data) => {
    // Truncate output for safety/brevity
    const sanitizedData = { ...data };
    if (typeof sanitizedData.output === 'string' && sanitizedData.output.length > 500) {
      sanitizedData.output = sanitizedData.output.substring(0, 500) + '... (truncated)';
    } else if (typeof sanitizedData.output === 'object') {
      const stringified = JSON.stringify(sanitizedData.output);
      if (stringified.length > 500) {
        sanitizedData.output = stringified.substring(0, 500) + '... (truncated)';
      }
    }

    logger.debug({
      label: 'agent',
      type: 'tool_call',
      ...sanitizedData
    });
  },

  /**
   * Log Agent Status
   */
  logStatus: (status, executionId, context = {}) => {
    logger.info({
      label: 'agent',
      type: 'status',
      status,
      executionId,
      ...context
    });
  },

  /**
   * Log Agent Error
   */
  logError: (error, executionId, context = {}) => {
    logger.error({
      label: 'agent',
      type: 'error',
      error: error.message || error,
      stack: error.stack,
      executionId,
      ...context
    });
  }
};
