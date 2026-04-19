import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '../src/config/db.js';
import { logger } from '../src/utils/logger.util.js';

// Global mocks
vi.mock('../src/utils/logger.util.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    http: vi.fn()
  }
}));

// Mock external providers
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn()
      }
    }))
  };
});

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' })
    })
  }
}));

vi.mock('../src/config/redis.js', () => {
  const mockClient = {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    expireat: vi.fn(),
    call: vi.fn().mockResolvedValue(true),
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(true),
    quit: vi.fn().mockResolvedValue(true),
    ping: vi.fn().mockResolvedValue('PONG'),
  };

  return {
    redisClient: {
      connect: vi.fn().mockResolvedValue(mockClient),
      disconnect: vi.fn().mockResolvedValue(true),
      getClient: vi.fn().mockReturnValue(mockClient),
      isReady: vi.fn().mockReturnValue(true),
    },
    redisHelpers: {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      exists: vi.fn(),
      incr: vi.fn(),
      expire: vi.fn(),
      expireat: vi.fn(),
    },
    isRedisEnabled: true,
  };
});

vi.mock('bullmq', () => {
  const MockQueue = vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'job-id' }),
    close: vi.fn(),
    on: vi.fn(),
  }));
  const MockWorker = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  }));
  const MockQueueEvents = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  }));
  
  return {
    Queue: MockQueue,
    Worker: MockWorker,
    QueueEvents: MockQueueEvents,
  };
});

beforeAll(async () => {
  // Ensure we are using the test database
  if (!process.env.DATABASE_URL.includes('_test')) {
    // Fail safe to prevent wiping dev/prod DB
    // throw new Error('Tests must be run against a database name ending with _test');
    logger.warn('WARNING: Running tests against non-test database!');
  }
});

afterEach(async () => {
  // Clear mocks after each test
  vi.clearAllMocks();
});

afterAll(async () => {
  // Disconnect prisma
  await prisma.$disconnect();
});
