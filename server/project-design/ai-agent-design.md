# AI Agent Engine Design

## Agent Loop Flow

```text
Agent Engine Start
      |
      v
1. Load workflow config + agent instruction
      |
      v
2. Build messages array:
   [system_prompt, user_message_with_trigger_data]
      |
      v
3. Call Claude API with tools defined
      |
      v
4. Response check:
   |-- stop_reason = "end_turn"  -> DONE, save output
   |-- stop_reason = "tool_use" -> Execute tools
            |
            v
      5. Execute each tool call:
         |-- Validate tool inputs
         |-- Call actual tool function
         |-- Capture output / error
            |
            v
      6. Add tool results to messages
         |
         v
      7. Loop back to step 3
            |
      (Max 10 iterations ya timeout pe force stop)
```

## Agent System Prompt Template

```text
You are an automation agent for {orgName}.

Your task: {agentInstruction}

Trigger data: {JSON.stringify(triggerData)}

Available tools: {toolDescriptions}

Rules:
- Use tools to complete the task
- If unsure, do the safest action
- Log important decisions
- Stop when task is complete
- Never expose sensitive credentials
- Always validate inputs before using tools
- Provide clear explanations for your actions
```

## Tool Definitions (Claude API Format)

```javascript
const tools = [
  {
    name: "send_email",
    description: "Send an email to a recipient",
    input_schema: {
      type: "object",
      properties: {
        to: { 
          type: "string", 
          description: "Recipient email address" 
        },
        subject: { 
          type: "string", 
          description: "Email subject line" 
        },
        body: { 
          type: "string", 
          description: "Email body (HTML supported)" 
        },
        cc: { 
          type: "array", 
          items: { type: "string" },
          description: "CC recipients (optional)"
        },
        bcc: { 
          type: "array", 
          items: { type: "string" },
          description: "BCC recipients (optional)"
        }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "http_request",
    description: "Make an HTTP request to an external API",
    input_schema: {
      type: "object",
      properties: {
        url: { 
          type: "string",
          description: "Target URL for the request"
        },
        method: { 
          type: "string", 
          enum: ["GET","POST","PUT","DELETE","PATCH"],
          description: "HTTP method"
        },
        headers: { 
          type: "object",
          description: "HTTP headers (optional)"
        },
        body: { 
          type: "object",
          description: "Request body for POST/PUT/PATCH (optional)"
        },
        timeout: {
          type: "number",
          description: "Request timeout in seconds (default: 30)"
        }
      },
      required: ["url", "method"]
    }
  },
  {
    name: "db_insert",
    description: "Insert data into a database table",
    input_schema: {
      type: "object",
      properties: {
        table: { 
          type: "string",
          description: "Target table name"
        },
        data: { 
          type: "object",
          description: "Data to insert"
        }
      },
      required: ["table", "data"]
    }
  },
  {
    name: "db_query",
    description: "Query data from a database table",
    input_schema: {
      type: "object",
      properties: {
        table: { 
          type: "string",
          description: "Target table name"
        },
        where: { 
          type: "object",
          description: "WHERE conditions (optional)"
        },
        select: { 
          type: "array",
          items: { type: "string" },
          description: "Columns to select (optional)"
        },
        limit: {
          type: "number",
          description: "Maximum number of rows (optional)"
        }
      },
      required: ["table"]
    }
  },
  {
    name: "send_slack_message",
    description: "Send a message to a Slack channel",
    input_schema: {
      type: "object",
      properties: {
        channel: { 
          type: "string",
          description: "Slack channel name (e.g., #general)"
        },
        message: { 
          type: "string",
          description: "Message content"
        },
        blocks: {
          type: "array",
          description: "Slack block kit elements (optional)"
        }
      },
      required: ["channel", "message"]
    }
  },
  {
    name: "generate_pdf",
    description: "Generate a PDF document from data",
    input_schema: {
      type: "object",
      properties: {
        template: { 
          type: "string",
          description: "PDF template name or HTML content"
        },
        data: { 
          type: "object",
          description: "Data to populate the template"
        },
        filename: {
          type: "string",
          description: "Output filename (optional)"
        }
      },
      required: ["template", "data"]
    }
  },
  {
    name: "scrape_webpage",
    description: "Extract content from a web page",
    input_schema: {
      type: "object",
      properties: {
        url: { 
          type: "string",
          description: "Target URL to scrape"
        },
        selector: { 
          type: "string",
          description: "CSS selector for content extraction (optional)"
        },
        wait_for: {
          type: "string",
          description: "Wait for selector before extracting (optional)"
        }
      },
      required: ["url"]
    }
  },
  {
    name: "delay",
    description: "Wait for a specified duration",
    input_schema: {
      type: "object",
      properties: {
        seconds: { 
          type: "number",
          description: "Number of seconds to wait"
        }
      },
      required: ["seconds"]
    }
  }
];
```

## Agent Engine Implementation

### Core Agent Class

```javascript
class AgentEngine {
  constructor(workflow, triggerData, executionId) {
    this.workflow = workflow;
    this.triggerData = triggerData;
    this.executionId = executionId;
    this.messages = [];
    this.maxIterations = 10;
    this.timeout = workflow.timeoutSeconds || 300;
    this.startTime = Date.now();
  }

  async execute() {
    try {
      // Initialize messages
      this.initializeMessages();
      
      // Main agent loop
      for (let iteration = 0; iteration < this.maxIterations; iteration++) {
        // Check timeout
        if (this.isTimeout()) {
          throw new Error('Agent execution timeout');
        }

        // Call Claude API
        const response = await this.callClaudeAPI();
        
        // Process response
        if (response.stop_reason === 'end_turn') {
          return this.handleCompletion(response);
        }
        
        if (response.stop_reason === 'tool_use') {
          await this.executeToolCalls(response.content);
        }
      }
      
      throw new Error('Agent exceeded maximum iterations');
    } catch (error) {
      await this.logError(error);
      throw error;
    }
  }

  initializeMessages() {
    this.messages = [
      {
        role: 'system',
        content: this.buildSystemPrompt()
      },
      {
        role: 'user',
        content: this.buildUserPrompt()
      }
    ];
  }

  buildSystemPrompt() {
    return `You are an automation agent for ${this.workflow.organization.name}.

Your task: ${this.workflow.agentInstruction}

Trigger data: ${JSON.stringify(this.triggerData)}

Available tools: ${this.getToolDescriptions()}

Rules:
- Use tools to complete the task
- If unsure, do the safest action
- Log important decisions
- Stop when task is complete
- Never expose sensitive credentials
- Always validate inputs before using tools
- Provide clear explanations for your actions`;
  }

  buildUserPrompt() {
    return `Please complete the following task using the available tools.

Task: ${this.workflow.agentInstruction}

Available workflow steps:
${this.workflow.steps.map(step => `- ${step.name}: ${step.tool}`).join('\n')}

Trigger data received:
${JSON.stringify(this.triggerData, null, 2)}

Please start executing the task.`;
  }

  async callClaudeAPI() {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: this.messages,
      tools: this.getToolDefinitions()
    });

    // Log the interaction
    await this.logInteraction(response);

    return response;
  }

  async executeToolCalls(toolCalls) {
    for (const toolCall of toolCalls) {
      if (toolCall.type === 'tool_use') {
        await this.executeSingleTool(toolCall);
      }
    }
  }

  async executeSingleTool(toolCall) {
    const { name, input } = toolCall;
    
    try {
      // Validate tool input
      this.validateToolInput(name, input);
      
      // Get tool function
      const tool = this.getToolFunction(name);
      
      // Execute tool
      const result = await tool.execute(input, {
        workflow: this.workflow,
        executionId: this.executionId,
        triggerData: this.triggerData
      });
      
      // Add tool result to messages
      this.messages.push({
        role: 'tool',
        content: JSON.stringify(result),
        tool_call_id: toolCall.id
      });
      
      // Log tool execution
      await this.logToolExecution(name, input, result);
      
    } catch (error) {
      // Add error result to messages
      this.messages.push({
        role: 'tool',
        content: JSON.stringify({ error: error.message }),
        tool_call_id: toolCall.id
      });
      
      await this.logToolError(name, input, error);
    }
  }

  validateToolInput(toolName, input) {
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    // Validate against schema
    const schema = tool.input_schema;
    // Implementation using Zod or similar
  }

  getToolFunction(toolName) {
    const toolRegistry = require('./tools');
    return toolRegistry.get(toolName);
  }

  isTimeout() {
    return (Date.now() - this.startTime) > (this.timeout * 1000);
  }

  async handleCompletion(response) {
    const output = this.extractOutput(response);
    await this.logCompletion(output);
    return output;
  }

  extractOutput(response) {
    // Extract final output from assistant's message
    const lastMessage = response.content.find(c => c.type === 'text');
    return {
      message: lastMessage?.text || 'Task completed',
      toolCalls: response.content.filter(c => c.type === 'tool_use'),
      tokensUsed: response.usage
    };
  }

  // Logging methods
  async logInteraction(response) {
    await AgentMessage.create({
      executionId: this.executionId,
      role: 'assistant',
      content: JSON.stringify(response),
      tokensIn: response.usage?.input_tokens || 0,
      tokensOut: response.usage?.output_tokens || 0,
      sequence: this.messages.length
    });
  }

  async logToolExecution(toolName, input, result) {
    await ExecutionStep.create({
      executionId: this.executionId,
      stepId: `tool_${Date.now()}`,
      stepName: toolName,
      toolName,
      status: 'success',
      input,
      output: result,
      completedAt: new Date()
    });
  }

  async logToolError(toolName, input, error) {
    await ExecutionStep.create({
      executionId: this.executionId,
      stepId: `tool_${Date.now()}`,
      stepName: toolName,
      toolName,
      status: 'failed',
      input,
      error: error.message,
      completedAt: new Date()
    });
  }

  async logError(error) {
    await Execution.update({
      where: { id: this.executionId },
      data: {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      }
    });
  }

  async logCompletion(output) {
    await Execution.update({
      where: { id: this.executionId },
      data: {
        status: 'success',
        output,
        completedAt: new Date(),
        durationMs: Date.now() - this.startTime
      }
    });
  }
}
```

## Tool Registry System

```javascript
// tools/index.js
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.loadTools();
  }

  loadTools() {
    const toolFiles = [
      './email.tool.js',
      './http.tool.js',
      './database.tool.js',
      './slack.tool.js',
      './pdf.tool.js',
      './scrape.tool.js',
      './delay.tool.js'
    ];

    toolFiles.forEach(file => {
      const tool = require(file);
      this.register(tool.name, tool);
    });
  }

  register(name, tool) {
    this.tools.set(name, tool);
  }

  get(name) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  }

  getAll() {
    return Array.from(this.tools.values());
  }

  getDefinitions() {
    return this.getAll().map(tool => tool.getDefinition());
  }
}

module.exports = new ToolRegistry();
```

## Tool Implementation Example

```javascript
// tools/email.tool.js
const nodemailer = require('nodemailer');

class EmailTool {
  constructor() {
    this.name = 'send_email';
    this.transporter = null;
  }

  async initialize() {
    // Initialize email transporter with org-specific config
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  getDefinition() {
    return {
      name: this.name,
      description: "Send an email to a recipient",
      input_schema: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body" },
          cc: { type: "array", items: { type: "string" } }
        },
        required: ["to", "subject", "body"]
      }
    };
  }

  async execute(input, context) {
    await this.initialize();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.body,
      cc: input.cc
    };

    const result = await this.transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };
  }
}

module.exports = new EmailTool();
```

## Error Handling and Safety

### Input Validation
- All tool inputs validated against schemas
- Sanitization of HTML content
- URL validation for HTTP requests
- Email format validation

### Timeout Protection
- Per-execution timeout limits
- Tool-specific timeout limits
- Maximum iteration limits

### Resource Limits
- Token usage tracking
- Memory usage monitoring
- Rate limiting for external APIs

### Security Measures
- Credential encryption in tool configs
- Input sanitization
- Output filtering for sensitive data
- Audit logging for all tool usage

## Performance Optimization

### Caching
- Tool configuration caching
- API response caching where appropriate
- Template caching for PDF generation

### Parallel Execution
- Independent tool calls can run in parallel
- Batch operations for database tools
- Connection pooling for HTTP tools

### Memory Management
- Message history pruning
- Large file streaming
- Garbage collection optimization

## Monitoring and Debugging

### Execution Metrics
- Token usage per execution
- Tool execution time
- Success/failure rates
- Error categorization

### Debug Information
- Full conversation history
- Tool input/output logging
- Performance metrics
- Error stack traces

### Alerting
- Execution failures
- High token usage
- Tool performance issues
- Security violations
