import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.util.js';
import { env } from './env.js';

const globalForPrisma = globalThis;

/**
 * Prisma Client Configuration with Tuning and Slow Query Logging
 */
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
    datasources: {
      db: {
        url: env.DATABASE_URL + (env.NODE_ENV === 'production' ? '?connection_limit=10&pool_timeout=10&statement_timeout=30000' : ''),
      },
    },
  });

  // Slow query logging middleware using events
  globalForPrisma.prisma.$on('query', (e) => {
    const duration = e.duration;
    if (duration > 1000 && duration <= 5000) {
      logger.warn(`Slow Database Query (>1s): ${e.query}`, {
        duration: `${duration}ms`,
        params: e.params,
      });
    } else if (duration > 5000) {
      logger.error(`Very Slow Database Query (>5s): ${e.query}`, {
        duration: `${duration}ms`,
        params: e.params,
      });
    }
  });
}

export const prisma = globalForPrisma.prisma;

/**
 * Handle initial connection
 */
export async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

/**
 * Graceful disconnect
 */
export async function disconnectDB() {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
}
