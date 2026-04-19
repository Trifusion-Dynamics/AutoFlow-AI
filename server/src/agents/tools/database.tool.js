import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';
import { v4 as uuidv4 } from 'uuid';

export const databaseTool = {
  definition: {
    name: 'db_insert',
    description: 'Save structured data from workflow execution',
    input_schema: {
      type: 'object',
      properties: {
        collection: { 
          type: 'string', 
          description: 'Logical collection name (e.g. leads, contacts)'
        },
        data: { 
          type: 'object', 
          description: 'Data to save as key-value pairs'
        }
      },
      required: ['collection', 'data']
    }
  },

  async execute(input, context) {
    try {
      // Save to executions output field via Prisma
      const execution = await prisma.execution.findUnique({
        where: { id: context.executionId }
      });

      if (!execution) {
        throw new Error('Execution not found');
      }

      const existingOutput = execution.output || {};
      const collectionData = existingOutput[input.collection] || [];

      const newEntry = {
        ...input.data,
        savedAt: new Date().toISOString(),
        id: uuidv4()
      };

      const updatedOutput = {
        ...existingOutput,
        [input.collection]: [...collectionData, newEntry]
      };

      await prisma.execution.update({
        where: { id: context.executionId },
        data: {
          output: updatedOutput
        }
      });

      logger.info('Data saved to execution output', {
        executionId: context.executionId,
        collection: input.collection,
        entryId: newEntry.id
      });

      return { 
        success: true, 
        output: { 
          saved: true, 
          collection: input.collection, 
          id: newEntry.id 
        } 
      };

    } catch (error) {
      logger.error('Failed to save data to execution output', {
        executionId: context.executionId,
        collection: input.collection,
        error: error.message
      });

      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};
