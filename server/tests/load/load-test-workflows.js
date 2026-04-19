import autocannon from 'autocannon';
import { faker } from '@faker-js/faker';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-123';

async function runWorkflowsLoadTest() {
  console.log('🚀 Starting Workflows Load Test (50 concurrent users)...');

  // We need an auth context for each connection.
  // For simplicity in this script, we assume connecting to a local dev setup 
  // where we can bypass or use a fixed test token.
  
  const instance = autocannon({
    url: APP_URL,
    connections: 50,
    duration: 10,
    requests: [
      {
        method: 'GET',
        path: '/api/v1/workflows',
        headers: { 'Authorization': `Bearer TEST_TOKEN` } // Will be setup in setupContext
      },
      {
        method: 'POST',
        path: '/api/v1/workflows',
        headers: { 
          'Authorization': `Bearer TEST_TOKEN`,
          'content-type': 'application/json' 
        },
        body: JSON.stringify({
          name: 'Load Test Workflow',
          description: 'Benchmark workflow creation',
          triggerType: 'webhook',
          aiModel: 'claude',
          steps: []
        })
      }
    ]
  }, (err, result) => {
    if (err) {
      console.error('Test failed:', err);
      process.exit(1);
    }
    console.log('✅ Workflows Load Test Completed');
    console.log(`Latency p95: ${result.latency.p95}ms`);
    console.log(`Throughput: ${result.requests.average} req/sec`);
    
    if (result.latency.p95 > 500) {
      console.warn('⚠️ WARNING: Latency p95 exceeded 500ms target!');
    }
  });

  autocannon.track(instance, { renderProgressBar: true });
}

runWorkflowsLoadTest();
