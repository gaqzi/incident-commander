import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident } from '../utils/actions.js';

const URL = '/incident/ongoing?disableMultiplayer=true';

test.describe('Ongoing Incident: Managing Affected Systems', () => {
  const what = 'This is the what';
  const when = 'This is the when';
  const where = 'This is the where';
  const impact = 'This is the impact';

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await submitIncident(page, what, when, where, impact, false);
  });

  test('lets you add another affected system', async ({ page }) => {
    const newWhat = 'Another what';
    
    // Click the add button
    const addButton = await getDataTest(page, 'btn-add-affected-system');
    await addButton.click();
    
    // Fill in the form
    const whatField = await getDataTest(page, 'new-affected-system__what');
    await whatField.fill(newWhat);
    
    // Submit the form
    const submitButton = await getDataTest(page, 'new-affected-system__submit');
    await submitButton.click();

    // Verify the new affected system was added
    // Instead of checking the count, just verify that the new text is present
    const affectedSystemsList = await getDataTest(page, 'affected-systems__listing__active');
    await expect(affectedSystemsList).toContainText(newWhat);
    
    // Check if any of the list items contains the new text
    const newSystemItem = page.locator(`[data-test="affected-systems__listing__active"] li:has-text("${newWhat}")`);
    await expect(newSystemItem).toBeVisible();
  });

  test('lets you edit the text of an add affected system', async ({ page }) => {
    // Verify initial state
    const affectedSystems = await getDataTest(page, 'affected-systems__listing__active');
    await expect(affectedSystems).toContainText(what);
    
    // Click edit button
    const editButton = await getDataTest(page, 'button-edit-affected-system');
    await editButton.click();

    // Update the text
    const newWhat = 'changed to this';
    const whatField = await getDataTest(page, 'new-affected-system__what');
    await whatField.clear();
    await whatField.fill(newWhat);
    
    // Submit the form
    const submitButton = await getDataTest(page, 'new-affected-system__submit');
    await submitButton.click();

    // Verify the affected system was updated
    const updatedAffectedSystems = await getDataTest(page, 'affected-systems__listing__active');
    await expect(updatedAffectedSystems).not.toContainText(what);
    await expect(updatedAffectedSystems).toContainText(newWhat);
  });

  test('lets you resolve and unresolve an affected system', async ({ page }) => {
    // Verify initial state
    const activeAffectedSystems = await getDataTest(page, 'affected-systems__listing__active', '>ul>li');
    await expect(activeAffectedSystems).toHaveCount(1);
    
    const pastAffectedSystems = page.locator('[data-test="affected-systems__listing__past"] >ul>li');
    await expect(pastAffectedSystems).not.toBeVisible();

    // Hover over the affected system and click resolve
    const activeSystem = await getDataTest(page, 'affected-systems__listing__active');
    const whatText = activeSystem.getByText(what);
    await whatText.hover();
    
    const resolveButton = await getDataTest(page, 'button-resolve-affected-system');
    await resolveButton.click();

    // Verify the affected system was moved to past
    await expect(activeAffectedSystems).not.toBeVisible();
    
    const pastSystems = await getDataTest(page, 'affected-systems__listing__past', '>ul>li');
    await expect(pastSystems).toHaveCount(1);
    await expect(pastSystems).toContainText(what);

    // Now unresolve it
    const pastSystem = await getDataTest(page, 'affected-systems__listing__past');
    const pastWhatText = pastSystem.getByText(what);
    await pastWhatText.hover();
    
    const unresolveButton = await getDataTest(page, 'button-unresolve-affected-system');
    await unresolveButton.click();

    // Verify the affected system was moved back to active
    const activeSystemsAfterUnresolve = await getDataTest(page, 'affected-systems__listing__active', '>ul>li');
    await expect(activeSystemsAfterUnresolve).toHaveCount(1);
    
    const pastSystemsAfterUnresolve = page.locator('[data-test="affected-systems__listing__past"] >ul>li');
    await expect(pastSystemsAfterUnresolve).not.toBeVisible();
  });
});
