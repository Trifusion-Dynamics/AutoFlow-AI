import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { logger } from '../../utils/logger.util.js';

export const scrapeTool = {
  definition: {
    name: 'scrape_webpage',
    description: 'Scrape the text content of a webpage given its URL.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the webpage to scrape.'
        },
        includeImages: {
          type: 'boolean',
          description: 'Whether to include image alt text.'
        }
      },
      required: ['url']
    }
  },

  async execute({ url, includeImages = false }) {
    try {
      logger.info(`Scraping webpage: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AutoFlowAI/1.0 (Workflow Automation Agent)'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove script and style elements
      $('script, style, nav, footer, header').remove();

      const title = $('title').text();
      const text = $('body').text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 10000); // Limit context size

      return {
        success: true,
        data: {
          title,
          url,
          text,
          length: text.length
        }
      };
    } catch (error) {
      logger.error('Scrape tool error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};
