import { defineConfig } from '@playwright/test';
import { configManager } from './src/config/ConfigManager';

export default defineConfig({
  testDir: './tests',

  // Limit workers to 2 to avoid hitting DummyJSON's rate limiter (429).
  // DummyJSON is a public free API — running too many parallel logins triggers
  // "request limit exceeded". 2 workers is a safe balance of speed vs. rate limits.
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 2 : 1,

  use: {
    baseURL: configManager.getBaseUrl(),
  },

  projects: [
    {
      name: 'smoke',
      grep: /@smoke/,
      retries: 1,
    },
    {
      name: 'integration',
      grep: /@integration/,
      retries: 1,
    },
    {
      name: 'contract',
      grep: /@contract/,
      retries: 1,
    },
    {
      name: 'all',
      retries: process.env.CI ? 2 : 1,
    },
  ],

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],
});