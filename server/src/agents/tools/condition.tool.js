import { logger } from '../../utils/logger.util.js';

export const conditionTool = {
  definition: {
    name: 'check_condition',
    description: 'Evaluate a logical condition on specific data. Helpful for branched logic.',
    input_schema: {
      type: 'object',
      properties: {
        leftValue: { type: 'any' },
        operator: { 
          type: 'string', 
          enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'exists'] 
        },
        rightValue: { type: 'any' }
      },
      required: ['leftValue', 'operator']
    }
  },

  async execute({ leftValue, operator, rightValue }) {
    try {
      logger.info(`Checking condition: ${leftValue} ${operator} ${rightValue}`);
      
      let pass = false;
      switch (operator) {
        case 'equals':
          pass = String(leftValue) === String(rightValue);
          break;
        case 'not_equals':
          pass = String(leftValue) !== String(rightValue);
          break;
        case 'contains':
          pass = String(leftValue).toLowerCase().includes(String(rightValue).toLowerCase());
          break;
        case 'greater_than':
          pass = Number(leftValue) > Number(rightValue);
          break;
        case 'less_than':
          pass = Number(leftValue) < Number(rightValue);
          break;
        case 'exists':
          pass = leftValue !== undefined && leftValue !== null && leftValue !== '';
          break;
        default:
          pass = false;
      }

      return {
        success: true,
        data: {
          result: pass,
          message: pass ? 'Condition passed' : 'Condition failed'
        }
      };
    } catch (error) {
      logger.error('Condition tool error:', error.message);
      return { success: false, error: error.message };
    }
  }
};
