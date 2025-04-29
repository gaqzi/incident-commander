import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident, addResourceLink, addActionToIncident } from '../utils/actions.js';

const URL = '/incident/ongoing?disableMultiplayer=true';

test.describe.serial('Ongoing Incident: Status Updates', () => {
  const what = 'This is the what';
  const when = 'This is the when';
  const where = 'This is the where';
  const impact = 'This is the impact';

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await submitIncident(page, what, when, where, impact, false);
  });

  test.describe.serial('Business Update', () => {
    test('provides the current status of the incident, the summary, and the currently affected components', async ({ page }) => {
      // Mock the clipboard API
      await page.evaluate(() => {
        window.clipboardText = '';
        const originalWriteText = navigator.clipboard.writeText;
        navigator.clipboard.writeText = text => {
          window.clipboardText = text;
          return Promise.resolve();
        };
      });

      // Click the business update button
      const businessUpdateButton = await getDataTest(page, 'button-business-update');
      await businessUpdateButton.click();

      // Get the clipboard text
      const clipboardText = await page.evaluate(() => window.clipboardText);
      
      // Verify the clipboard text
      const expectedText = `Business Update\n*Investigating*\nSince ${when} we are seeing ${what} in ${where} impacting ${impact}.\n\n*Current status:*\n- 🔴 ${what}`;
      expect(clipboardText).toBe(expectedText);
    });
  });

  test.describe.serial('Tech Update', () => {
    test('provides the status, summary, resources, affected components, current actions', async ({ page }) => {
      // Mock the clipboard API
      await page.evaluate(() => {
        window.clipboardText = '';
        const originalWriteText = navigator.clipboard.writeText;
        navigator.clipboard.writeText = text => {
          window.clipboardText = text;
          return Promise.resolve();
        };
      });

      // Add resource links
      await addResourceLink(page, 'Link One', 'http://one.com');
      await addResourceLink(page, 'Link Two', 'http://two.com');

      // Add active action
      await addActionToIncident(page, { 
        what: '0 Active', 
        who: 'Person 0', 
        link: 'http://zero.com/', 
        minutes: 0 
      });
      
      // Add timeline entries to active action
      const timelineInputs = await getDataTest(page, 'action__timeline_form__text');
      const firstTimelineInput = timelineInputs.nth(0);
      await firstTimelineInput.fill('Active Note A');
      await page.keyboard.press('Enter');
      
      await firstTimelineInput.fill('Active Note B');
      await page.keyboard.press('Enter');
      
      await firstTimelineInput.fill('Active Note C');
      await page.keyboard.press('Enter');
      
      await firstTimelineInput.fill('Active Note D');
      await page.keyboard.press('Enter');

      // Add actions that will be marked as inactive
      await addActionToIncident(page, { 
        what: '1 Chore', 
        who: 'Person 1', 
        link: 'http://one.com/', 
        minutes: 0 
      });
      
      await addActionToIncident(page, { 
        what: '2 Succeeded', 
        who: 'Person 2', 
        link: 'http://two.com/', 
        minutes: 0 
      });
      
      // Add timeline entry to the action that will be marked as succeeded
      // Get all timeline input fields and use page.locator to select the third one (index 2)
      const allTimelineInputs = page.locator('[data-test="action__timeline_form__text"]');
      const succeededTimelineInput = allTimelineInputs.nth(2);
      await succeededTimelineInput.fill('Succeeded Note A');
      await page.keyboard.press('Enter');
      
      await addActionToIncident(page, { 
        what: '3 Failed', 
        who: 'Person 3', 
        link: 'http://three.com/', 
        minutes: 0 
      });
      
      // Add timeline entry to the action that will be marked as failed
      // Get all timeline input fields again and use page.locator to select the fourth one (index 3)
      const updatedTimelineInputs = page.locator('[data-test="action__timeline_form__text"]');
      const failedTimelineInput = updatedTimelineInputs.nth(3);
      await failedTimelineInput.fill('Failed Note A');
      await page.keyboard.press('Enter');

      // Mark actions as chore, success, and failure
      // Mark as chore
      const moreButtons = await getDataTest(page, 'action__more');
      await moreButtons.nth(1).hover();
      const choreButton = await getDataTest(page, 'action__resolve_chore');
      await choreButton.click({ force: true });

      // Mark as success
      await moreButtons.nth(1).hover();
      const successButton = await getDataTest(page, 'action__resolve_success');
      await successButton.click({ force: true });

      // Set up dialog handler BEFORE clicking the button
      await page.on('dialog', dialog => {
        // Enter the text and accept the dialog
        dialog.accept('It failed.');
      });

      // Mark as failure
      await moreButtons.nth(1).hover();
      const failureButton = await getDataTest(page, 'action__resolve_failure');
      await failureButton.click({ force: true });

      // Click the tech update button
      const techUpdateButton = await getDataTest(page, 'button-tech-update');
      await techUpdateButton.click();

      // Get the clipboard text
      const clipboardText = await page.evaluate(() => window.clipboardText);
      
      // Verify the clipboard text
      const expectedText = '' +
        `Tech Update` +
        `\n*Investigating*` +
        `\nSince ${when} we are seeing ${what} in ${where} impacting ${impact}.` +
        `\n` +
        `\n*Resources:*` +
        `\n- [Link One](http://one.com)` +
        `\n- [Link Two](http://two.com)` +
        `\n` +
        `\n*Current status:*` +
        `\n- 🔴 ${what}` +
        `\n    *Actions:*` +
        `\n    - 0 Active (@Person 0) [More info](http://zero.com/)` +
        `\n        - Active Note D` +
        `\n        - Active Note C` +
        `\n        - Active Note B` +
        `\n        - Active Note A` +
        `\n` +
        `\n    *Past Actions:*` +
        `\n    - ✔️ 2 Succeeded (@Person 2) [More info](http://two.com/)` +
        `\n        - Succeeded Note A` +
        `\n    - ❌ 3 Failed (@Person 3) [More info](http://three.com/) -- It failed.` +
        `\n        - Failed Note A`;
      
      expect(clipboardText).toBe(expectedText);
    });
  });
});
