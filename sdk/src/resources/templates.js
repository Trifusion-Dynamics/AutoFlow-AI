export class TemplatesResource {
  constructor(client) {
    this.client = client;
    this.requestClient = client.requestClient;
  }

  async list(params) {
    return this.requestClient.get('/templates', params);
  }

  async get(id) {
    return this.requestClient.get(`/templates/${id}`);
  }

  async createWorkflow(templateId, data) {
    return this.requestClient.post(`/templates/${templateId}/use`, data);
  }
}
