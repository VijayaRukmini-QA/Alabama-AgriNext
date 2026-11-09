import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, CUSTOMER_BASE_URL } from './config/env';

export default defineConfig({
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3, // modest: Entra may rate-limit
  timeout: 60_000, // Entra redirect takes ~10 s
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    // Lender (Entra login): tests/e2e only.
    {
      name: 'chromium',
      testDir: 'tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: BASE_URL },
      grepInvert: /@mobile/,
    },
    {
      name: 'mobile',
      testDir: 'tests/e2e',
      use: { ...devices['Pixel 5'], baseURL: BASE_URL },
      grep: /@mobile/,
    },
    // Customer portal: tests/customer only.
    {
      name: 'customer-chromium',
      testDir: 'tests/customer',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: CUSTOMER_BASE_URL,
        screenshot: 'on',
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
      },
      grepInvert: /@e2e-full|@mobile/,
    },
    {
      name: 'customer-mobile',
      testDir: 'tests/customer',
      use: { ...devices['Pixel 5'], baseURL: CUSTOMER_BASE_URL },
      grep: /@mobile/,
    },
    // Real registration with live email/SMS inboxes. Opt-in (RUN_CUSTOMER_E2E=1) inside the spec.
    {
      name: 'customer-e2e',
      testDir: 'tests/customer',
      retries: 0,
      timeout: 10 * 60_000,
      use: { ...devices['Desktop Chrome'], baseURL: CUSTOMER_BASE_URL },
      grep: /@e2e-full/,
    },
  ],
});
