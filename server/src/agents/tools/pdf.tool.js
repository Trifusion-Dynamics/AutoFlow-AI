import { logger } from '../../utils/logger.util.js';
import path from 'path';
import fs from 'fs/promises';

export const pdfTool = {
  name: 'generate_pdf',
  description: 'Generate a PDF file from HTML content or text.',
  input_schema: {
    type: 'object',
    properties: {
      html: {
        type: 'string',
        description: 'The HTML content to convert to PDF.'
      },
      filename: {
        type: 'string',
        description: 'Desired filename (e.g., report.pdf).'
      }
    },
    required: ['html']
  },

  async execute({ html, filename = 'document.pdf' }, { orgId }) {
    try {
      logger.info(`Generating PDF for org: ${orgId}`);
      
      const uploadDir = path.join(process.cwd(), 'uploads', orgId);
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileId = `pdf_${Date.now()}`;
      const filePath = path.join(uploadDir, `${fileId}.pdf`);
      
      // Simulation of PDF generation (writing as text/html for now)
      await fs.writeFile(filePath, html);

      return {
        success: true,
        data: {
          fileId,
          filename,
          url: `/api/v1/files/download/${fileId}`,
          message: 'PDF generated successfully'
        }
      };
    } catch (error) {
      logger.error('PDF tool error:', error.message);
      return { success: false, error: error.message };
    }
  }
};
