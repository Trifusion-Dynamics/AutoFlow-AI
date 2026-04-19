# Queue & Job System Design

## BullMQ Queue Architecture

### Queue Types

```text
Queues:
|
|--- agent-jobs          -> Workflow executions (heavy, AI calls)
|--- email-jobs          -> Email sending (fast)
|--- cron-scheduler      -> Cron workflow triggers
|--- cleanup-jobs        -> Old log cleanup, token reset
|--- notification-jobs   -> User notifications
|--- webhook-jobs        -> External webhook calls
```

### Queue Configuration

```javascript
// agent-jobs configuration
{
  name: 'agent-jobs',
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,      // Keep last 100 completed jobs
    removeOnFail: 50,           // Keep last 50 failed jobs
    attempts: 3,                // Retry attempts
    backoff: {
      type: 'exponential',
      delay: 5000              // Initial delay: 5 seconds
    },
    delay: 0,                  // No initial delay
    priority: 1                // Normal priority
  },
  settings: {
    stalledInterval: 30000,     // 30 seconds
    maxStalledCount: 1,         // Max stalled count
    lockDuration: 30000         // 30 seconds lock
  }
}

// email-jobs configuration
{
  name: 'email-jobs',
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 100,
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 2000              // Fixed 2 second delay
    },
    delay: 0,
    priority: 5                // Higher priority for emails
  },
  settings: {
    stalledInterval: 15000,     // 15 seconds
    maxStalledCount: 2,
    lockDuration: 15000
  }
}
```

### Concurrency Settings

```javascript
// Queue worker configurations
const workerConfigs = {
  'agent-jobs': {
    concurrency: 5,             // Max 5 concurrent AI jobs
    limiter: {
      max: 10,                 // Max 10 jobs per minute
      duration: 60000,         // Per minute
      groupKey: 'orgId'        // Per organization limit
    }
  },
  'email-jobs': {
    concurrency: 20,            // Max 20 concurrent email jobs
    limiter: {
      max: 100,                // Max 100 emails per minute
      duration: 60000
    }
  },
  'cron-scheduler': {
    concurrency: 1,             // Single cron scheduler
    limiter: {
      max: 60,                 // Max 60 triggers per minute
      duration: 60000
    }
  },
  'cleanup-jobs': {
    concurrency: 2,             // Max 2 cleanup jobs
    limiter: {
      max: 10,                 // Max 10 cleanups per hour
      duration: 3600000
    }
  }
};
```

## Job Data Structures

### Agent Jobs

```javascript
// agent-jobs payload
{
  executionId: "uuid",
  workflowId: "uuid",
  orgId: "uuid",
  userId: "uuid",               // User who triggered (if manual)
  triggeredBy: "webhook|cron|manual",
  triggerData: {                // Input data that triggered this
    email: "user@example.com",
    name: "John Doe",
    plan: "pro"
  },
  agentInstruction: "New lead aaya hai. Unhe warm welcome email bhejo aur CRM mein entry karo.",
  steps: [
    {
      id: "step_1",
      name: "Send Welcome Email",
      tool: "send_email",
      config: {
        to: "{{trigger.data.email}}",
        subject: "Welcome {{trigger.data.name}}!",
        body: "AI generated content"
      }
    }
  ],
  timeout: 300,                 // Max execution time in seconds
  maxRetries: 3,
  priority: 1,
  createdAt: "2025-01-15T10:30:00Z"
}
```

### Email Jobs

```javascript
// email-jobs payload
{
  emailId: "uuid",
  orgId: "uuid",
  executionId: "uuid",         // Related execution (optional)
  type: "transactional|marketing|notification",
  to: "recipient@example.com",
  cc: ["cc@example.com"],
  bcc: ["bcc@example.com"],
  subject: "Welcome to AutoFlow AI",
  body: "<h1>Welcome!</h1><p>Thanks for joining...</p>",
  template: "welcome-email",    // Template name (optional)
  templateData: {               // Template variables
    userName: "John",
    plan: "Pro"
  },
  priority: 5,
  scheduledFor: null,          // ISO timestamp for scheduled emails
  retryCount: 0,
  maxRetries: 5
}
```

### Cron Scheduler Jobs

```javascript
// cron-scheduler payload
{
  workflowId: "uuid",
  orgId: "uuid",
  schedule: "0 9 * * *",        // Cron expression
  timezone: "Asia/Kolkata",
  lastRun: "2025-01-14T09:00:00Z",
  nextRun: "2025-01-15T09:00:00Z",
  isActive: true,
  triggerData: {                // Default trigger data
    scheduled: true,
    timestamp: "2025-01-15T09:00:00Z"
  }
}
```

### Cleanup Jobs

```javascript
// cleanup-jobs payload
{
  type: "executions|logs|tokens|cache",
  orgId: "uuid",                // Optional - for org-specific cleanup
  olderThan: "2024-12-15T00:00:00Z",
  limit: 1000,                  // Max records to process
  dryRun: false                 // Set to true for testing
}
```

## Queue Worker Implementation

### Agent Job Processor

```javascript
// queues/processors/agent.processor.js
const { Worker } = require('bullmq');
const AgentEngine = require('../../agents/engine');
const ExecutionRepository = require('../../modules/executions/executions.repository');
const redisConnection = require('../../config/redis');

class AgentProcessor {
  constructor() {
    this.worker = new Worker(
      'agent-jobs',
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 60000,
          groupKey: 'orgId'
        }
      }
    );

    this.setupEventHandlers();
  }

  async processJob(job) {
    const { executionId, workflowId, orgId } = job.data;
    
    try {
      // Update execution status to running
      await ExecutionRepository.updateStatus(executionId, 'running');
      
      // Load workflow details
      const workflow = await this.loadWorkflow(workflowId);
      
      // Create and run agent engine
      const agent = new AgentEngine(workflow, job.data.triggerData, executionId);
      const result = await agent.execute();
      
      // Update execution with success
      await ExecutionRepository.complete(executionId, result);
      
      return { success: true, result };
      
    } catch (error) {
      // Update execution with error
      await ExecutionRepository.fail(executionId, error);
      
      // Log error for monitoring
      this.logError(job, error);
      
      throw error; // Re-throw to trigger BullMQ retry logic
    }
  }

  async loadWorkflow(workflowId) {
    // Load workflow with all necessary data
    return await WorkflowRepository.findByIdWithRelations(workflowId);
  }

  setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`Agent job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Agent job ${job.id} failed:`, err);
      
      // Check if max retries reached
      if (job.attemptsMade >= job.opts.attempts) {
        this.handleMaxRetriesReached(job);
      }
    });

    this.worker.on('stalled', (job) => {
      console.warn(`Agent job ${job.id} stalled`);
    });
  }

  async handleMaxRetriesReached(job) {
    // Mark execution as permanently failed
    await ExecutionRepository.fail(job.data.executionId, new Error('Max retries exceeded'));
    
    // Send notification to user
    await this.sendFailureNotification(job);
  }

  async sendFailureNotification(job) {
    // Add notification job to queue
    await notificationQueue.add('send-failure-alert', {
      orgId: job.data.orgId,
      workflowId: job.data.workflowId,
      executionId: job.data.executionId,
      error: job.failedReason
    });
  }

  logError(job, error) {
    // Structured error logging
    logger.error('Agent job failed', {
      jobId: job.id,
      executionId: job.data.executionId,
      workflowId: job.data.workflowId,
      orgId: job.data.orgId,
      error: error.message,
      stack: error.stack,
      attempts: job.attemptsMade
    });
  }
}

module.exports = new AgentProcessor();
```

### Email Job Processor

```javascript
// queues/processors/email.processor.js
const { Worker } = require('bullmq');
const EmailService = require('../../services/email.service');
const EmailRepository = require('../../modules/emails/emails.repository');

class EmailProcessor {
  constructor() {
    this.worker = new Worker(
      'email-jobs',
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 20
      }
    );

    this.setupEventHandlers();
  }

  async processJob(job) {
    const emailData = job.data;
    
    try {
      // Send email
      const result = await EmailService.send(emailData);
      
      // Log email sent
      await EmailRepository.logSent(emailData, result);
      
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      // Log email failed
      await EmailRepository.logFailed(emailData, error);
      
      throw error;
    }
  }

  setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`Email job ${job.id} sent successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Email job ${job.id} failed:`, err);
    });
  }
}

module.exports = new EmailProcessor();
```

## Queue Management API

### Queue Status Monitoring

```javascript
// queues/queueManager.js
class QueueManager {
  constructor() {
    this.queues = new Map();
    this.initializeQueues();
  }

  initializeQueues() {
    const queueNames = ['agent-jobs', 'email-jobs', 'cron-scheduler', 'cleanup-jobs'];
    
    queueNames.forEach(name => {
      this.queues.set(name, new Queue(name, { connection: redisConnection }));
    });
  }

  async getQueueStatus(queueName) {
    const queue = this.queues.get(queueName);
    
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      queueName,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      },
      workers: await queue.getWorkers(),
      paused: await queue.isPaused()
    };
  }

  async getAllQueueStatus() {
    const status = {};
    
    for (const [name] of this.queues) {
      status[name] = await this.getQueueStatus(name);
    }
    
    return status;
  }

  async pauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    await queue.pause();
  }

  async resumeQueue(queueName) {
    const queue = this.queues.get(queueName);
    await queue.resume();
  }

  async cleanQueue(queueName, grace = 0) {
    const queue = this.queues.get(queueName);
    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
  }

  async retryFailedJobs(queueName) {
    const queue = this.queues.get(queueName);
    const failedJobs = await queue.getFailed();
    
    for (const job of failedJobs) {
      await job.retry();
    }
  }
}
```

## Job Scheduling and Triggers

### Cron Scheduler

```javascript
// queues/cronScheduler.js
const cron = require('node-cron');
const agentQueue = require('./agent.queue');

class CronScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.startScheduler();
  }

  async startScheduler() {
    // Run every minute to check for due workflows
    cron.schedule('* * * * *', async () => {
      await this.checkDueWorkflows();
    });
  }

  async checkDueWorkflows() {
    try {
      const dueWorkflows = await WorkflowRepository.findDueCronWorkflows();
      
      for (const workflow of dueWorkflows) {
        await this.triggerWorkflow(workflow);
      }
    } catch (error) {
      logger.error('Cron scheduler error:', error);
    }
  }

  async triggerWorkflow(workflow) {
    // Add to agent queue
    await agentQueue.add('execute-workflow', {
      executionId: generateUUID(),
      workflowId: workflow.id,
      orgId: workflow.orgId,
      triggeredBy: 'cron',
      triggerData: {
        scheduled: true,
        timestamp: new Date().toISOString()
      },
      agentInstruction: workflow.agentInstruction,
      steps: workflow.steps,
      timeout: workflow.timeoutSeconds
    });

    // Update last run time
    await WorkflowRepository.updateLastRun(workflow.id, new Date());
  }

  async scheduleWorkflow(workflow) {
    const cronExpression = workflow.triggerConfig.schedule;
    
    if (this.scheduledJobs.has(workflow.id)) {
      // Cancel existing schedule
      this.scheduledJobs.get(workflow.id).stop();
    }

    const task = cron.schedule(cronExpression, async () => {
      await this.triggerWorkflow(workflow);
    }, {
      scheduled: false,
      timezone: workflow.triggerConfig.timezone || 'UTC'
    });

    this.scheduledJobs.set(workflow.id, task);
    task.start();
  }

  async unscheduleWorkflow(workflowId) {
    const task = this.scheduledJobs.get(workflowId);
    if (task) {
      task.stop();
      this.scheduledJobs.delete(workflowId);
    }
  }
}
```

## Error Handling and Retry Logic

### Retry Strategies

```javascript
// retryStrategies.js
class RetryStrategies {
  static exponential(attemptsMade) {
    return {
      type: 'exponential',
      delay: Math.min(5000 * Math.pow(2, attemptsMade), 300000) // Max 5 minutes
    };
  }

  static fixed(delay = 2000) {
    return {
      type: 'fixed',
      delay
    };
  }

  static linear(attemptsMade) {
    return {
      type: 'linear',
      delay: 2000 * attemptsMade
    };
  }

  static custom(job) {
    // Custom logic based on job data
    if (job.data.priority === 'high') {
      return { type: 'fixed', delay: 1000 };
    }
    return { type: 'exponential', delay: 5000 };
  }
}
```

### Error Classification

```javascript
// errorClassifier.js
class ErrorClassifier {
  static classify(error) {
    if (error.code === 'ECONNREFUSED') {
      return 'NETWORK_ERROR';
    }
    if (error.code === 'ETIMEDOUT') {
      return 'TIMEOUT_ERROR';
    }
    if (error.message.includes('rate limit')) {
      return 'RATE_LIMIT_ERROR';
    }
    if (error.message.includes('authentication')) {
      return 'AUTH_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  static shouldRetry(error, attemptsMade) {
    const classification = this.classify(error);
    
    switch (classification) {
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
        return attemptsMade < 5;
      case 'RATE_LIMIT_ERROR':
        return attemptsMade < 3;
      case 'AUTH_ERROR':
        return false; // Don't retry auth errors
      default:
        return attemptsMade < 3;
    }
  }
}
```

## Performance Monitoring

### Queue Metrics

```javascript
// metrics.js
class QueueMetrics {
  static async collectMetrics() {
    const queueManager = new QueueManager();
    const allStatus = await queueManager.getAllQueueStatus();
    
    return {
      timestamp: new Date().toISOString(),
      queues: allStatus,
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpu: process.cpuUsage()
      }
    };
  }

  static async getJobMetrics(queueName, timeRange = '1h') {
    const queue = new Queue(queueName, { connection: redisConnection });
    
    const [completed, failed] = await Promise.all([
      queue.getCompleted(0, -1, true),
      queue.getFailed(0, -1, true)
    ]);

    const timeRangeMs = this.parseTimeRange(timeRange);
    const now = Date.now();
    
    const recentCompleted = completed.filter(job => 
      (now - job.finishedOn) <= timeRangeMs
    );
    
    const recentFailed = failed.filter(job => 
      (now - job.finishedOn) <= timeRangeMs
    );

    return {
      queueName,
      timeRange,
      completed: recentCompleted.length,
      failed: recentFailed.length,
      successRate: recentCompleted.length / (recentCompleted.length + recentFailed.length),
      avgProcessingTime: this.calculateAvgProcessingTime(recentCompleted)
    };
  }

  static parseTimeRange(range) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    const match = range.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error('Invalid time range format');
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  static calculateAvgProcessingTime(jobs) {
    if (jobs.length === 0) return 0;
    
    const totalTime = jobs.reduce((sum, job) => {
      return sum + (job.finishedOn - job.processedOn);
    }, 0);
    
    return totalTime / jobs.length;
  }
}
```

## Security Considerations

### Job Data Encryption
- Sensitive job data encrypted before queueing
- Tool credentials encrypted in job payloads
- Personal data masked in logs

### Access Control
- Queue access limited to authorized workers
- Job data access based on organization
- Audit trail for all queue operations

### Rate Limiting
- Per-organization job limits
- Global queue rate limits
- Tool-specific rate limits

## Scaling Considerations

### Horizontal Scaling
- Multiple worker processes
- Queue partitioning by organization
- Load balancing across workers

### Resource Management
- Memory usage monitoring
- Connection pooling
- Worker process recycling

### Disaster Recovery
- Queue persistence in Redis
- Job state recovery
- Backup and restore procedures
