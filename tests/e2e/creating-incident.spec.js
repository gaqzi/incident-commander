import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident } from '../utils/actions.js';

const URL = '/incident/ongoing?disableMultiplayer=true';

test.describe('Creating a New Incident', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
  });

  test('creates a new incident - without default actions', async ({ page }) => {
    const what = 'This is the what';
    const when = '2021-01-02 11:22:00';
    const where = 'This is the where';
    const impact = 'This is the impact';

    await submitIncident(page, what, when, where, impact, false);

    // Summary
    const summary = await getDataTest(page, 'summary');
    await expect(summary).toContainText(what);
    await expect(summary).toContainText(when);
    await expect(summary).toContainText(where);
    await expect(summary).toContainText(impact);

    // Affected Systems
    const affectedSystems = await getDataTest(page, 'affected-systems__listing__active', '>ul>li');
    await expect(affectedSystems).toHaveCount(1);
    await expect(affectedSystems).toContainText(what);
    
    const actions = await affectedSystems.locator('[data-test="actions__active"] li.action');
    await expect(actions).toHaveCount(0);

    const pastSystems = await getDataTest(page, 'affected-systems__listing__past', 'li');
    await expect(pastSystems).toHaveCount(0);
  });

  test('creates a new incident - with default actions', async ({ page }) => {
    const what = 'This is the what';
    const when = 'This is the when';
    const where = 'This is the where';
    const impact = 'This is the impact';

    await submitIncident(page, what, when, where, impact, true);

    // Check that past affected systems don't exist
    const pastSystem = await getDataTest(page, 'affected-system__past');
    await expect(pastSystem).not.toBeVisible();

    // Check that active affected systems exist with default actions
    const activeSystem = await getDataTest(page, 'affected-system__active');
    await expect(activeSystem).toHaveCount(1);
    await expect(activeSystem).toContainText('Was a feature flag toggled recently?');
    await expect(activeSystem).toContainText('Has there been an infrastructure change recently?');
  });

  test('can select the status through the keyboard', async ({ page }) => {
    const statusSelect = await getDataTest(page, 'summary__select__status');
    await statusSelect.click();
    await page.keyboard.type('monitor');
    await page.keyboard.press('Enter');
    
    const what = 'This is the what';
    const when = 'This is the when';
    const where = 'This is the where';
    const impact = 'This is the impact';

    await submitIncident(page, what, when, where, impact, true);

    const summaryStatus = await getDataTest(page, 'summary', '.status');
    await expect(summaryStatus).toContainText('Monitoring');
  });
});
