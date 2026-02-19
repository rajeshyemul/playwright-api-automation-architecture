import { defineConfig } from '@playwright/test';
import { configManager } from './src/config/configManager';

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: configManager.getBaseUrl(),
  },

  reporter: [
    ['html'],
    ['json', { outputFile: 'reports/results.json' }]
  ],
});