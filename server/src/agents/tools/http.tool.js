import { logger } from '../../utils/logger.util.js';
import { filesService } from '../../modules/files/files.service.js';

export const httpTool = {
  definition: {
    name: 'http_request',
    description: 'Make HTTP request to external API or webhook',
    input_schema: {
      type: 'object',
      properties: {
        url: { 
          type: 'string', 
          description: 'Full URL with https://' 
        },
        method: { 
          type: 'string', 
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method'
        },
        headers: { 
          type: 'object', 
          description: 'Request headers as key-value pairs'
        },
        body: { 
          type: 'object', 
          description: 'Request body for POST/PUT/PATCH'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 10000)'
        },
        fileId: {
          type: 'string',
          description: 'ID of an uploaded file to attach as multipart/form-data'
        }
      },
      required: ['url', 'method']
    }
  },

  async execute(input, context) {
    try {
      // Security: Block internal IPs
      const url = new URL(input.url);
      const hostname = url.hostname;
      
      // Block localhost, 127.x.x.x, 192.168.x.x, 10.x.x.x
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.')) {
        throw new Error('Requests to internal IP addresses are not allowed');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), input.timeout || 10000);

      const fetchOptions = {
        method: input.method,
        headers: {
          'Content-Type': 'application/json',
          ...input.headers
        },
        signal: controller.signal
      };

      // Handle body or file attachment
      if (['POST', 'PUT', 'PATCH'].includes(input.method)) {
        if (input.fileId) {
          const { content, file } = await filesService.getFile(input.fileId, context.orgId);
          const formData = new FormData();
          formData.append('file', new Blob([content]), file.name);
          
          if (input.body) {
            Object.entries(input.body).forEach(([k, v]) => {
              formData.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
            });
          }
          
          fetchOptions.body = formData;
          // Let fetch set the boundary for multipart/form-data
          delete fetchOptions.headers['Content-Type'];
        } else if (input.body) {
          fetchOptions.body = JSON.stringify(input.body);
        }
      }

      const response = await fetch(input.url, fetchOptions);
      clearTimeout(timeout);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const result = {
        success: true,
        output: {
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers)
        }
      };

      logger.info('HTTP request completed', {
        url: input.url,
        method: input.method,
        status: response.status
      });

      return result;

    } catch (error) {
      logger.error('HTTP request failed', {
        url: input.url,
        method: input.method,
        error: error.message
      });

      return {
        success: false,
        error: `Request failed: ${error.message}`
      };
    }
  }
};
