import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage();

/**
 * requestContext utility for propagating context across the application
 * traceId, requestId, orgId, userId are stored here
 */
export const requestContext = {
  /**
   * Run a function within a context
   * @param {Object} data - Context data
   * @param {Function} callback - Function to run
   */
  run: (data, callback) => storage.run(data, callback),

  /**
   * Get the current context
   * @returns {Object|undefined}
   */
  getContext: () => storage.getStore(),

  /**
   * Set context data (merges with existing)
   * @param {Object} data - Context data to set
   */
  setContext: (data) => {
    const context = storage.getStore();
    if (context) {
      Object.assign(context, data);
    }
  },

  /**
   * Shorthand to get requestId
   * @returns {string|null}
   */
  getRequestId: () => storage.getStore()?.requestId || null,

  /**
   * Shorthand to get traceId
   * @returns {string|null}
   */
  getTraceId: () => storage.getStore()?.traceId || null,

  /**
   * Shorthand to get orgId
   * @returns {string|null}
   */
  getOrgId: () => storage.getStore()?.orgId || null,

  /**
   * Shorthand to get userId
   * @returns {string|null}
   */
  getUserId: () => storage.getStore()?.userId || null,
};
