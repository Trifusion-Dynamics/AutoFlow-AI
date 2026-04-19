import { logger } from '../../utils/logger.util.js';

export const transformTool = {
  definition: {
    name: 'transform_data',
    description: 'Transform data using simple logic or formatting. Good for cleaning tool outputs.',
    input_schema: {
      type: 'object',
      properties: {
        data: {
          type: 'any',
          description: 'The data to transform.'
        },
        format: {
          type: 'string',
          enum: ['json', 'csv', 'minified_json', 'text_summary'],
          description: 'Target format.'
        }
      },
      required: ['data', 'format']
    }
  },

  async execute({ data, format }) {
    try {
      logger.info(`Transforming data to ${format}`);
      
      let result;
      switch (format) {
        case 'json':
          result = JSON.stringify(data, null, 2);
          break;
        case 'minified_json':
          result = JSON.stringify(data);
          break;
        case 'csv':
          if (Array.isArray(data)) {
            const keys = Object.keys(data[0] || {});
            const csv = [
              keys.join(','),
              ...data.map(row => keys.map(k => `"${row[k]}"`).join(','))
            ].join('\n');
            result = csv;
          } else {
            result = data.toString();
          }
          break;
        case 'text_summary':
          result = typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : data.toString();
          break;
        default:
          result = data;
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Transform tool error:', error.message);
      return { success: false, error: error.message };
    }
  }
};
