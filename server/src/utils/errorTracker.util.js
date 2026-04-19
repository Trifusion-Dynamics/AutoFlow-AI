import { logger } from './logger.util.js';
import { env } from '../config/env.js';
import fetch from 'node-fetch';

/**
 * Advanced Error Aggregation & Tracking
 */
class ErrorTracker {
  constructor() {
    this.errors = new Map(); // signature -> { count, lastSeen, samples, lastAlerted }
    this.maxUniqueErrors = 100;
  }

  /**
   * Track an error occurrence
   */
  track(error, context = {}) {
    const signature = this.getSignature(error);
    const now = Date.now();

    let record = this.errors.get(signature);
    if (!record) {
      if (this.errors.size >= this.maxUniqueErrors) {
        // Simple LRU or clear first one
        const firstKey = this.errors.keys().next().value;
        this.errors.delete(firstKey);
      }
      record = {
        count: 0,
        lastSeen: now,
        samples: [],
        lastAlerted: 0
      };
      this.errors.set(signature, record);
    }

    record.count++;
    record.lastSeen = now;

    // Keep first 3 samples for debugging
    if (record.samples.length < 3) {
      record.samples.push({
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        context,
        timestamp: now
      });
    }

    // Check for critical alerts
    this.checkAlerting(signature, record);
  }

  getSignature(error) {
    return `${error.name}:${error.message.substring(0, 50)}`;
  }

  async checkAlerting(signature, record) {
    const alertThreshold = 10; // 10 occurrences before alerting
    const alertCooldown = 300000; // 5 minutes
    const now = Date.now();

    if (record.count >= alertThreshold && (now - record.lastAlerted > alertCooldown)) {
      record.lastAlerted = now;
      await this.sendAlert(signature, record);
    }
  }

  async sendAlert(signature, record) {
    const webhookUrl = env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;

    logger.error(`🚨 CRITICAL ERROR ALERT: ${signature} (Seen ${record.count} times)`);

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: 'CRITICAL_ERROR_THRESHOLD',
          signature,
          count: record.count,
          lastSeen: new Date(record.lastSeen).toISOString(),
          samples: record.samples
        })
      });
    } catch (err) {
      logger.error('Failed to send error alert webhook:', err.message);
    }
  }

  getSummary() {
    return Array.from(this.errors.entries()).map(([sig, data]) => ({
      signature: sig,
      count: data.count,
      lastSeen: new Date(data.lastSeen).toISOString()
    }));
  }

  getDetails(signature) {
    return this.errors.get(signature);
  }

  reset() {
    this.errors.clear();
  }
}

export const errorTracker = new ErrorTracker();
