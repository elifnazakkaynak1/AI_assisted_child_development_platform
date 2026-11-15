// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'npm run seed && npm start',
      cwd: './backend',
      port: 3000, 
      reuseExistingServer: !process.env.CI,
      env: {
        JWT_SECRET: 'jwt_key',
        AI_MODE: 'mock',
        NODE_ENV: 'test',
      },
    },
    {
      command: 'npm run dev',
      cwd: './frontend',
      port: 5173, 
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ]
});

