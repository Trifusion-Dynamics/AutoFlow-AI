import { logger } from '../../utils/logger.util.js';

export const logTool = {
  definition: {
    name: 'log_message',
    description: 'Log a message during workflow execution for debugging',
    input_schema: {
      type: 'object',
      properties: {
        level: { 
          type: 'string', 
          enum: ['info', 'warn', 'error'],
          description: 'Log level'
        },
        message: { 
          type: 'string',
          description: 'Message to log'
        },
        data: { 
          type: 'object', 
          description: 'Optional extra data' 
        }
      },
      required: ['level', 'message']
    }
  },

  async execute(input, context) {
    try {
      const logMessage = `[Workflow ${context.workflowId}] ${input.message}`;
      
      switch (input.level) {
        case 'info':
          logger.info(logMessage, input.data);
          break;
        case 'warn':
          logger.warn(logMessage, input.data);
          break;
        case 'error':
          logger.error(logMessage, input.data);
          break;
        default:
          logger.info(logMessage, input.data);
      }

      return { 
        success: true, 
        output: { 
          logged: true,
          level: input.level,
          message: input.message
        } 
      };

    } catch (error) {
      // Logging should never fail the workflow
      logger.error('Failed to log message', {
        originalMessage: input.message,
        error: error.message
      });

      return { 
        success: true, 
        output: { 
          logged: false,
          error: 'Logging failed but workflow continues'
        } 
      };
    }
  }
};
