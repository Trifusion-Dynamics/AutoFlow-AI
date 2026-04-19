import axios from 'axios';
import { 
  AutoFlowError, 
  AuthenticationError, 
  ValidationError, 
  NotFoundError, 
  RateLimitError, 
  QuotaExceededError 
} from '../errors.js';

export class RequestClient {
  constructor(client) {
    this.client = client;
    this.axios = axios.create({
      baseURL: client.baseUrl,
      timeout: client.timeout,
    });
  }

  async request(config) {
    let retries = 0;
    const maxRetries = this.client.maxRetries;

    const execute = async () => {
      try {
        const response = await this.axios.request({
          ...config,
          headers: {
            ...config.headers,
            'Authorization': `Bearer ${this.client.apiKey}`,
            'X-Idempotency-Key': config.method?.toUpperCase() === 'POST' ? Math.random().toString(36).substring(7) : undefined,
          }
        });
        return response.data?.data || response.data;
      } catch (error) {
        if (error.response) {
          const { status, data } = error.response;
          const message = data.message || error.message;
          const code = data.code;

          if ((status === 429 || status === 503) && retries < maxRetries) {
            retries++;
            const delay = Math.pow(2, retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return execute();
          }

          switch (status) {
            case 401: throw new AuthenticationError(message, status, code, data);
            case 403: throw new AuthenticationError(message, status, code, data);
            case 404: throw new NotFoundError(message, status, code, data);
            case 422: throw new ValidationError(message, status, code, data);
            case 429: throw new RateLimitError(message, status, code, data);
            default:
              if (code === 'QUOTA_EXCEEDED') throw new QuotaExceededError(message, status, code, data);
              throw new AutoFlowError(message, status, code, data);
          }
        }
        throw new AutoFlowError(error.message);
      }
    };

    return execute();
  }

  get(url, params) { return this.request({ method: 'GET', url, params }); }
  post(url, data) { return this.request({ method: 'POST', url, data }); }
  put(url, data) { return this.request({ method: 'PUT', url, data }); }
  delete(url) { return this.request({ method: 'DELETE', url }); }
}
