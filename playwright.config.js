// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:5432',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on test failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    // Firefox is temporarily disabled due to flaky tests in CI
    // {
    //   name: 'firefox',
    //   use: { 
    //     browserName: 'firefox',
    //     // Increase timeouts for Firefox as it seems to be slower
    //     actionTimeout: 45000,
    //     navigationTimeout: 45000,
    //   },
    // },
    // WebKit (Safari) is temporarily disabled due to an issue with FixedBackgroundsPaintRelativeToDocument
    // Uncomment when the issue is resolved or when testing specifically in WebKit
    // {
    //   name: 'webkit',
    //   use: { browserName: 'webkit' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5432',
    reuseExistingServer: !process.env.CI,
  },
});
