import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.util.js';

export const emailTool = {
  definition: {
    name: 'send_email',
    description: 'Send an email to a recipient',
    input_schema: {
      type: 'object',
      properties: {
        to: { 
          type: 'string', 
          description: 'Recipient email address' 
        },
        subject: { 
          type: 'string', 
          description: 'Email subject line' 
        },
        body: { 
          type: 'string', 
          description: 'Email body — HTML supported' 
        },
        cc: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'CC recipients (optional)'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },

  async execute(input, context) {
    try {
      // Check if SMTP is configured with placeholder values
      const isPlaceholder = env.SMTP_USER === 'test@example.com' || 
                           env.SMTP_PASS === 'test-app-password';

      if (isPlaceholder) {
        logger.info('Email would be sent (simulation mode)', { 
          to: input.to, 
          subject: input.subject 
        });
        
        return { 
          success: true, 
          output: { 
            simulated: true, 
            to: input.to, 
            subject: input.subject 
          } 
        };
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.body,
        ...(input.cc && { cc: input.cc })
      };

      const result = await transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: input.to,
        subject: input.subject
      });

      return { 
        success: true, 
        output: { 
          messageId: result.messageId, 
          to: input.to, 
          subject: input.subject 
        } 
      };

    } catch (error) {
      logger.error('Failed to send email', { 
        error: error.message, 
        to: input.to, 
        subject: input.subject 
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};
