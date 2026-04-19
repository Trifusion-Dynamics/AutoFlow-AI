import { RequestClient } from './utils/request.js';
import { WorkflowsResource } from './resources/workflows.js';
import { ExecutionsResource } from './resources/executions.js';
import { WebhooksResource } from './resources/webhooks.js';
import { TemplatesResource } from './resources/templates.js';
import { UsageResource } from './resources/usage.js';
import { WebhookVerifier } from './utils/webhookVerifier.js';

export class AutoFlowAI {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - Your API Key
   * @param {string} [options.baseUrl='https://api.autoflow.ai/api/v1'] - API Base URL
   * @param {number} [options.timeout=30000] - Request timeout in ms
   * @param {number} [options.retries=3] - Number of retries for 429/503
   */
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new Error('API Key is required');
    }

    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://api.autoflow.ai/api/v1';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.retries !== undefined ? options.retries : 3;

    this.requestClient = new RequestClient(this);

    this.workflows = new WorkflowsResource(this);
    this.executions = new ExecutionsResource(this);
    this.webhooks = new WebhooksResource(this);
    this.templates = new TemplatesResource(this);
    this.usage = new UsageResource(this);
  }

  /**
   * Static utility to verify webhook signatures
   */
  static verifyWebhookSignature(secret, payload, signature) {
    return WebhookVerifier.verify(secret, payload, signature);
  }
}
