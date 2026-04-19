export class WebhooksResource {
  constructor(client) {
    this.client = client;
    this.requestClient = client.requestClient;
  }

  async list(params) {
    return this.requestClient.get('/outbound-webhooks', params);
  }

  async create(data) {
    return this.requestClient.post('/outbound-webhooks', data);
  }

  async get(id) {
    return this.requestClient.get(`/outbound-webhooks/${id}`);
  }

  async update(id, data) {
    return this.requestClient.put(`/outbound-webhooks/${id}`, data);
  }

  async delete(id) {
    return this.requestClient.delete(`/outbound-webhooks/${id}`);
  }
}
