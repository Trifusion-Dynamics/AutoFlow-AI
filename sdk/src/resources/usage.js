export class UsageResource {
  constructor(client) {
    this.client = client;
    this.requestClient = client.requestClient;
  }

  async getSummary() {
    return this.requestClient.get('/usage/summary');
  }

  async getHistory(params) {
    return this.requestClient.get('/usage/history', params);
  }
}
