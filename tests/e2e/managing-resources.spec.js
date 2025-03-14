import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident, addResourceLink } from '../utils/actions.js';

const URL = '/incident/ongoing?disableMultiplayer=true';

test.describe('Ongoing Incident: Managing Resources', () => {
  test.beforeEach(async ({ page }) => {
    const what = 'This is the what';
    const when = 'This is the when';
    const where = 'This is the where';
    const impact = 'This is the impact';

    await page.goto(URL);
    await submitIncident(page, what, when, where, impact, false);
  });

  test('lets you add and edit resource links', async ({ page }) => {
    // Add a resource link
    await addResourceLink(page, 'Link One', 'http://one.com');
    
    // Verify the link was added
    const resourceLinks = await getDataTest(page, 'incident-summary__resources', 'ul.incident-summary__links__list li');
    await expect(resourceLinks).toContainText('Link One');
    
    // Check the href attribute
    const linkElement = resourceLinks.locator('a');
    await expect(linkElement).toHaveAttribute('href', 'http://one.com');

    // Edit the link
    await resourceLinks.hover();
    const editButton = await getDataTest(page, 'button-edit-resource');
    await editButton.click();

    // Update the link details
    const nameField = await getDataTest(page, 'resource-link__name');
    await nameField.clear();
    await nameField.fill('Link One Updated');
    
    const urlField = await getDataTest(page, 'resource-link__url');
    await urlField.clear();
    await urlField.fill('http://one-updated.com');
    
    const submitButton = await getDataTest(page, 'resource-link__submit');
    await submitButton.click();

    // Verify the link was updated
    const updatedResourceLinks = await getDataTest(page, 'incident-summary__resources', 'ul.incident-summary__links__list li');
    await expect(updatedResourceLinks).toContainText('Link One Updated');
    
    // Check the updated href attribute
    const updatedLinkElement = updatedResourceLinks.locator('a');
    await expect(updatedLinkElement).toHaveAttribute('href', 'http://one-updated.com');
  });
});
