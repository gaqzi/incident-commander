import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident } from '../utils/actions.js';

const URL = '/incident/ongoing?disableMultiplayer=true';

test.describe('Ongoing Incident: Collaborating in the shared notepad', () => {
  const what = 'This is the what';
  const when = 'This is the when';
  const where = 'This is the where';
  const impact = 'This is the impact';

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await submitIncident(page, what, when, where, impact, false);
  });

  test('lets you write in a notepad', async ({ page }) => {
    // Note: we aren't simulating anything in multiplayer for these tests, so the fact that this is a multiplayer notepad isn't tested yet
    const notes = await getDataTest(page, 'notes');
    
    // The notes element might be a div with contenteditable or a special editor component
    // Let's try to type into it using keyboard actions instead of fill
    await notes.click();
    await page.keyboard.type('Hello there');
    
    // Verify the text was entered
    await expect(notes).toContainText('Hello there');
  });
});
