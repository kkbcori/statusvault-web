import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:  './tests',
  timeout:  30_000,
  retries:  1,
  workers:  1,           // serial — tests share the same deployed site
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
    ['list'],
  ],
  use: {
    baseURL:       process.env.SV_URL || 'https://www.statusvault.org',
    headless:      !process.env.HEADED,
    screenshot:    'only-on-failure',
    video:         'on-first-retry',
    trace:         'on-first-retry',
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // mobile-safari requires webkit: run 'npx playwright install webkit' to enable
    // { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
