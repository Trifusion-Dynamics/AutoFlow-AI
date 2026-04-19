export class ExecutionsResource {
  constructor(client) {
    this.client = client;
    this.requestClient = client.requestClient;
  }

  async list(params) {
    return this.requestClient.get('/executions', params);
  }

  async get(id) {
    return this.requestClient.get(`/executions/${id}`);
  }

  async getStats() {
    return this.requestClient.get('/executions/stats');
  }
}
