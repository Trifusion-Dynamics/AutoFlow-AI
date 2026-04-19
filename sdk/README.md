# AutoFlow AI JavaScript SDK

Official SDK for interacting with the AutoFlow AI API.

## Installation

```bash
npm install @autoflow/sdk
```

## Quick Start

```javascript
import { AutoFlowAI } from '@autoflow/sdk';

const autoflow = new AutoFlowAI({
  apiKey: 'your_api_key_here'
});

// Create a workflow
const workflow = await autoflow.workflows.create({
  name: 'Customer Follow-up',
  triggerType: 'webhook',
  steps: [...]
});

// Run a workflow
const execution = await autoflow.workflows.run(workflow.id, {
  input: { email: 'user@example.com' }
});

// Check status
const status = await autoflow.executions.get(execution.executionId);
console.log(`Execution status: ${status.status}`);
```

## Features

- **Automatic Retries**: Retries with exponential backoff on rate limits (429) and server errors (503).
- **Idempotency**: Automatic idempotency key generation for POST requests.
- **Typed Errors**: Specific error classes like `AuthenticationError`, `RateLimitError`, and `QuotaExceededError`.
- **Webhook Verification**: Built-in utility to verify incoming webhook signatures.

## Error Handling

```javascript
try {
  await autoflow.workflows.run('invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error('Workflow not found');
  } else if (error instanceof RateLimitError) {
    console.error('Hit rate limit, please wait');
  }
}
```

## License

MIT
