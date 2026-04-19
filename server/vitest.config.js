import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'prisma/**',
        'dist/**',
        '**/*.d.ts',
        'src/config/**',
        'src/app.js',
        'src/server.js'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    },
    setupFiles: ['./tests/setup.js'],
    fileParallelism: true,
    maxThreads: 5,
    minThreads: 1
  }
});
