import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.util.js';

export const slackTool = {
  definition: {
    name: 'send_slack_message',
    description: 'Send notification message to Slack channel',
    input_schema: {
      type: 'object',
      properties: {
        channel: { 
          type: 'string', 
          description: 'Channel name like #general' 
        },
        message: { 
          type: 'string', 
          description: 'Message text to send' 
        },
        webhookUrl: { 
          type: 'string', 
          description: 'Slack incoming webhook URL (optional if configured)'
        }
      },
      required: ['channel', 'message']
    }
  },

  async execute(input, context) {
    try {
      // Check if org has Slack webhookUrl in toolConfigs
      let webhookUrl = input.webhookUrl;

      if (!webhookUrl) {
        const toolConfig = await prisma.toolConfig.findFirst({
          where: {
            orgId: context.orgId,
            toolName: 'slack'
          }
        });

        if (toolConfig && toolConfig.config?.webhookUrl) {
          webhookUrl = toolConfig.config.webhookUrl;
        }
      }

      // If no webhookUrl available, simulate
      if (!webhookUrl) {
        logger.info('Slack message would be sent (simulation mode)', {
          channel: input.channel,
          message: input.message
        });

        return { 
          success: true, 
          output: { 
            simulated: true, 
            channel: input.channel,
            message: 'Slack integration not configured - message simulated'
          } 
        };
      }

      // Send to Slack webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input.message,
          channel: input.channel
        })
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
      }

      logger.info('Slack message sent successfully', {
        channel: input.channel,
        orgId: context.orgId
      });

      return { 
        success: true, 
        output: { 
          sent: true, 
          channel: input.channel 
        } 
      };

    } catch (error) {
      logger.error('Failed to send Slack message', {
        channel: input.channel,
        orgId: context.orgId,
        error: error.message
      });

      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};
