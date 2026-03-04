import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgres://postgres:postgres@localhost:4210/evee',
      JWT_SECRET: 'dev-secret-change-in-production',
      OPENROUTER_API_KEY: 'test-key-not-real',
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
