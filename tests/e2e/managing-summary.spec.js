import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident } from '../utils/actions.js';

const URL = '/incident/ongoing?disableMultiplayer=true';

test.describe('Ongoing Incident: Managing the Summary', () => {
  const what = 'This is the what';
  const when = 'This is the when';
  const where = 'This is the where';
  const impact = 'This is the impact';

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await submitIncident(page, what, when, where, impact, false);
  });

  test('lets you edit the incident summary attributes', async ({ page }) => {
    // Verify initial state
    const affectedSystems = await getDataTest(page, 'affected-systems__listing__active');
    await expect(affectedSystems).toContainText(what);
    
    // Verify the form is not visible initially
    const whatInput = page.locator('[data-test="summary__input__what"]');
    await expect(whatInput).not.toBeVisible();
    
    // Click edit button
    const editButton = await getDataTest(page, 'button-edit-summary');
    await editButton.click();

    // Set new values
    const newStatus = 'Monitoring';
    const newWhat = 'new what';
    const newWhen = 'new when';
    const newWhere = 'new where';
    const newImpact = 'new impact';

    // Update status
    const statusSelect = await getDataTest(page, 'summary__select__status');
    await statusSelect.click();
    await page.keyboard.type(`${newStatus}`);
    await page.keyboard.press('Enter');
    
    // Update other fields
    const whatField = await getDataTest(page, 'summary__input__what');
    await whatField.clear();
    await whatField.fill(newWhat);
    
    const whenField = await getDataTest(page, 'summary__input__when');
    await whenField.clear();
    await whenField.fill(newWhen);
    
    const whereField = await getDataTest(page, 'summary__input__where');
    await whereField.clear();
    await whereField.fill(newWhere);
    
    const impactField = await getDataTest(page, 'summary__input__impact');
    await impactField.clear();
    await impactField.fill(newImpact);
    
    // Submit the form
    const submitButton = await getDataTest(page, 'summary__submit');
    await submitButton.click();

    // Verify the updated values
    const summary = await getDataTest(page, 'summary');
    await expect(summary).toContainText(newStatus);
    await expect(summary).toContainText(newWhat);
    await expect(summary).toContainText(newWhen);
    await expect(summary).toContainText(newWhere);
    await expect(summary).toContainText(newImpact);
    
    // Verify old values are not present
    await expect(summary).not.toContainText(what);
    await expect(summary).not.toContainText(when);
    await expect(summary).not.toContainText(where);
    await expect(summary).not.toContainText(impact);
  });
});
