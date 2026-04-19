import autocannon from 'autocannon';
import { faker } from '@faker-js/faker';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function runAuthLoadTest() {
  const email = `bench-${Date.now()}@example.com`;
  const password = 'Password@123';
  const name = 'Benchmark User';
  const orgName = 'Benchmark Org';

  console.log('🚀 Starting Auth Load Test (100 concurrent users)...');

  const instance = autocannon({
    url: APP_URL,
    connections: 100,
    duration: 10,
    requests: [
      {
        method: 'POST',
        path: '/api/v1/auth/register',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password, orgName }),
        setupRequest: (req) => {
          // Register only once per connection ideally, but autocannon repeats requests.
          // For a true cycle, we'll use a dynamic email.
          const dynamicEmail = `user-${faker.string.uuid()}@example.com`;
          req.body = JSON.stringify({ name, email: dynamicEmail, password, orgName });
          return req;
        }
      },
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        onResponse: (status, body, context) => {
          if (status === 200) {
            const data = JSON.parse(body);
            context.accessToken = data.accessToken;
            context.refreshToken = data.refreshToken;
          }
        }
      },
      {
        method: 'POST',
        path: '/api/v1/auth/refresh',
        headers: { 'content-type': 'application/json' },
        setupRequest: (req, context) => {
          req.body = JSON.stringify({ refreshToken: context.refreshToken });
          return req;
        }
      }
    ]
  }, (err, result) => {
    if (err) {
      console.error('Test failed:', err);
      process.exit(1);
    }
    console.log('✅ Auth Load Test Completed');
    console.log(`Latency p95: ${result.latency.p95}ms`);
    console.log(`Throughput: ${result.requests.average} req/sec`);
    
    if (result.latency.p95 > 200) {
      console.warn('⚠️ WARNING: Latency p95 exceeded 200ms target!');
    }
  });

  autocannon.track(instance, { renderProgressBar: true });
}

runAuthLoadTest();
