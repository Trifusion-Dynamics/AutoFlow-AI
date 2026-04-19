import { config } from 'dotenv';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Load environment variables from .env file
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(65535)).default('3000'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  
  DATABASE_URL: z.string().url('Invalid DATABASE_URL format'),
  REDIS_URL: z.string().url('Invalid REDIS_URL format'),
  
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(65535)).default('587'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  EMAIL_FROM: z.string().email().default('AutoFlow AI <noreply@autoflow.ai>'),
  
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
  
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be exactly 32 characters').max(32, 'ENCRYPTION_KEY must be exactly 32 characters'),
  WEBHOOK_TIMEOUT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1000)).default('30000'),
  
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1000)).default('60000'),
  RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1)).default('200'),
  
  ADMIN_SECRET: z.string().min(32, 'ADMIN_SECRET must be at least 32 characters'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  CORS_ORIGINS: z.string().default('*'),
  MAX_REQUEST_SIZE: z.string().default('1mb'),
  COMPRESSION_ENABLED: z.string().transform(v => v === 'true').default('true'),
});

function validateEnv() {
  try {
    const parsed = envSchema.safeParse(process.env);
    
    if (!parsed.success) {
      const validationError = fromZodError(parsed.error);
      console.error('Environment validation failed:');
      console.error(validationError.message);
      process.exit(1);
    }

    const env = parsed.data;

    // Production-only hardening
    if (env.NODE_ENV === 'production') {
      if (!env.APP_URL.startsWith('https://')) {
        console.warn('⚠️ WARNING: APP_URL should use HTTPS in production');
      }
      
      if (env.JWT_ACCESS_SECRET.length < 64) {
        console.warn('⚠️ WARNING: JWT_ACCESS_SECRET is too short for production (min 64 chars recommended)');
      }

      if (env.ADMIN_SECRET.length < 64) {
        console.warn('⚠️ WARNING: ADMIN_SECRET is too short for production (min 64 chars recommended)');
      }
    }

    return env;
  } catch (error) {
    console.error('Critical failure in environment validation:', error);
    process.exit(1);
  }
}

export const env = validateEnv();
