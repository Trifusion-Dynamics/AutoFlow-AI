import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.util.js';
import nodemailer from 'nodemailer';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379'),
  password: new URL(env.REDIS_URL).password,
  tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
};

// Transporter setup should ideally come from a config
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const emailWorker = new Worker('email-jobs', async (job) => {
  const { to, subject, body, html } = job.data;
  
  logger.info(`Sending email to ${to}: ${subject}`);

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || '"AutoFlow AI" <no-reply@autoflow.ai>',
      to,
      subject,
      text: body,
      html: html || body,
    });
    
    return { messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
}, { connection, concurrency: 20 });
