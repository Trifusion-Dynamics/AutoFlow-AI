import autocannon from 'autocannon';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function runExecutionsLoadTest() {
  console.log('🚀 Starting Executions Load Test (20 concurrent users)...');
  
  const instance = autocannon({
    url: APP_URL,
    connections: 20,
    duration: 10,
    requests: [
      {
        method: 'POST',
        path: '/api/v1/workflows/RUN_ANY_ID/run', // Replace with a valid ID during manual testing
        headers: { 
          'Authorization': `Bearer TEST_TOKEN`,
          'content-type': 'application/json' 
        },
        body: JSON.stringify({
          data: { test: 'load' }
        })
      },
      {
        method: 'GET',
        path: '/api/v1/executions',
        headers: { 'Authorization': `Bearer TEST_TOKEN` }
      }
    ]
  }, (err, result) => {
    if (err) {
      console.error('Test failed:', err);
      process.exit(1);
    }
    console.log('✅ Executions Load Test Completed');
    console.log(`Latency p95: ${result.latency.p95}ms`);
    console.log(`Throughput: ${result.requests.average} req/sec`);
  });

  autocannon.track(instance, { renderProgressBar: true });
}

runExecutionsLoadTest();
