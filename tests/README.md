# Playwright Tests for Incident Commander

This directory contains end-to-end tests for the Incident Commander application using Playwright.

## Migration from Cypress

The test suite has been migrated from Cypress to Playwright to enable testing of multiplayer features using Playwright's multi-browser capabilities. All existing Cypress tests have been ported to Playwright.

## Test Structure

- `tests/e2e/`: Contains all end-to-end test files organized by feature
- `tests/utils/`: Contains utility functions and helpers for the tests
  - `selectors.js`: Helper functions for selecting elements by data-test attributes
  - `actions.js`: Common actions used across tests (submitting incidents, adding resources, etc.)

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests with UI mode (shows Playwright Test UI)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run tests in headed mode (shows browser windows)
npm run test:headed

# Run tests for a specific browser
npm run test -- --project=chromium
npm run test -- --project=firefox

# Run a specific test file
npm run test -- tests/e2e/creating-incident.spec.js

# Run tests and watch for changes (development mode)
npm run dev:test
```

## Test Development

### Adding New Tests

1. Create a new test file in the `tests/e2e/` directory
2. Import the necessary utilities from `tests/utils/`
3. Use the Playwright test API to write your tests

Example:

```javascript
import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident } from '../utils/actions.js';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/incident/ongoing?disableMultiplayer=true');
    // Setup code...
  });

  test('my test case', async ({ page }) => {
    // Test code...
    await expect(page).toHaveTitle('Expected Title');
  });
});
```

### Testing Multiplayer Features

Playwright supports testing with multiple browser contexts, which can be used to test multiplayer features. Here's an example of how to test multiplayer features:

```javascript
test('two users can collaborate', async ({ browser }) => {
  // Create two browser contexts (simulating two different users)
  const userAContext = await browser.newContext();
  const userBContext = await browser.newContext();
  
  // Create pages for each user
  const userAPage = await userAContext.newPage();
  const userBPage = await userBContext.newPage();
  
  // Navigate both users to the application
  await userAPage.goto('/incident/ongoing');
  await userBPage.goto('/incident/ongoing');
  
  // Test multiplayer interactions...
  
  // Clean up
  await userAContext.close();
  await userBContext.close();
});
```

## Known Issues

- WebKit (Safari) tests are currently disabled due to an issue with the `FixedBackgroundsPaintRelativeToDocument` setting. This will be re-enabled once the issue is resolved.
- Firefox tests may be less reliable and can sometimes time out or fail due to differences in how Firefox handles certain UI interactions. The tests are primarily optimized for Chromium. For the most reliable test runs, use the default `npm test` command which runs tests only in Chromium.
