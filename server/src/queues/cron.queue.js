// Queue stubs for Phase 3 - Direct execution for now
import { logger } from '../utils/logger.util.js';

export const cronQueue = null;

export async function addCronJob(data) {
  logger.info('Queue disabled - running directly');
  return { id: 'direct-' + Date.now() };
}
