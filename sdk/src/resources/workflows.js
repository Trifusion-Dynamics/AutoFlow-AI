export class WorkflowsResource {
  constructor(client) {
    this.client = client;
    this.requestClient = client.requestClient;
  }

  /**
   * List all workflows
   * @param {Object} params - Filter and pagination params
   */
  async list(params) {
    return this.requestClient.get('/workflows', params);
  }

  /**
   * Create a new workflow
   * @param {Object} data - Workflow configuration
   */
  async create(data) {
    return this.requestClient.post('/workflows', data);
  }

  /**
   * Get a specific workflow
   * @param {string} id - Workflow ID
   */
  async get(id) {
    return this.requestClient.get(`/workflows/${id}`);
  }

  /**
   * Update an existing workflow
   * @param {string} id - Workflow ID
   * @param {Object} data - Fields to update
   */
  async update(id, data) {
    return this.requestClient.put(`/workflows/${id}`, data);
  }

  /**
   * Delete a workflow
   * @param {string} id - Workflow ID
   */
  async delete(id) {
    return this.requestClient.delete(`/workflows/${id}`);
  }

  /**
   * Activate a workflow
   * @param {string} id - Workflow ID
   */
  async activate(id) {
    return this.requestClient.post(`/workflows/${id}/activate`);
  }

  /**
   * Pause a workflow
   * @param {string} id - Workflow ID
   */
  async pause(id) {
    return this.requestClient.post(`/workflows/${id}/pause`);
  }

  /**
   * Run a workflow
   * @param {string} id - Workflow ID
   * @param {Object} input - Execution input
   */
  async run(id, input) {
    return this.requestClient.post(`/workflows/${id}/run`, { input });
  }

  /**
   * Get execution logs for a workflow
   * @param {string} id - Workflow ID
   */
  async getLogs(id) {
    return this.requestClient.get(`/executions`, { workflowId: id });
  }
}
