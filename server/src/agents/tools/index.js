import { emailTool } from './email.tool.js';
import { httpTool } from './http.tool.js';
import { databaseTool } from './database.tool.js';
import { slackTool } from './slack.tool.js';
import { logTool } from './log.tool.js';
import { scrapeTool } from './scrape.tool.js';
import { pdfTool } from './pdf.tool.js';
import { transformTool } from './transform.tool.js';
import { conditionTool } from './condition.tool.js';

export const toolRegistry = {
  send_email: emailTool,
  http_request: httpTool,
  db_insert: databaseTool,
  send_slack_message: slackTool,
  log_message: logTool,
  scrape_webpage: scrapeTool,
  generate_pdf: pdfTool,
  transform_data: transformTool,
  check_condition: conditionTool
};

export function getTool(name) {
  const tool = toolRegistry[name];
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

// AI providers ke liye tool definitions array
export function getToolDefinitions() {
  return Object.values(toolRegistry).map(t => t.definition);
}
