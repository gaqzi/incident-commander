import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident, addActionToIncident } from '../utils/actions.js';

const URL = '/incident/ongoing?disableMultiplayer=true';

test.describe('Ongoing Incident: Managing Actions', () => {
  const what = 'This is the what';
  const when = 'This is the when';
  const where = 'This is the where';
  const impact = 'This is the impact';

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await submitIncident(page, what, when, where, impact, false);
  });

  test('lets you add an action', async ({ page }) => {
    // Verify no actions exist initially
    const initialActions = await getDataTest(page, 'actions__active', 'li.action');
    await expect(initialActions).not.toBeVisible();

    // Add an action
    const actionWhat = 'a new action';
    const actionWho = 'john doe';
    const actionLink = 'http://example.com';
    const actionMinutes = 10;
    
    await addActionToIncident(page, { 
      what: actionWhat, 
      who: actionWho, 
      link: actionLink, 
      minutes: actionMinutes 
    });

    // Verify the action was added
    const actions = await getDataTest(page, 'actions__active', '>li.action');
    await expect(actions).toHaveCount(1);
    await expect(actions).toContainText(actionWhat);
    await expect(actions).toContainText(actionWho);
    
    // Check the link
    const linkElement = actions.locator(`a[href="${actionLink}"]`);
    await expect(linkElement).toBeVisible();
  });

  test('allows you to start typing the what without clicking on the field', async ({ page }) => {
    // Click the add action button
    const addButton = await getDataTest(page, 'actions__active__add_action');
    await addButton.click();

    // Verify the what field is focused
    const whatField = await getDataTest(page, 'new-action__what');
    await expect(whatField).toBeFocused();
  });

  test('lets you edit the text of an active action', async ({ page }) => {
    // Add an action
    const actionWhat = 'old what';
    await addActionToIncident(page, { what: actionWhat });

    // Edit the action
    const moreButton = await getDataTest(page, 'action__more');
    await moreButton.hover();
    
    const editButton = await getDataTest(page, 'action__edit');
    await editButton.click();

    // Update the text
    const newWhat = 'new what';
    const whatField = await getDataTest(page, 'new-action__what');
    await whatField.clear();
    await whatField.fill(newWhat);
    
    // Submit the form
    const submitButton = await getDataTest(page, 'action-form__submit');
    await submitButton.click();

    // Verify the action was updated
    const actionCard = await getDataTest(page, 'action-card', '>.ant-card-head');
    await expect(actionCard).not.toContainText(actionWhat);
    await expect(actionCard).toContainText(newWhat);
  });

  test('lets you edit the link of an active action', async ({ page }) => {
    // Add an action
    const linkVal = 'http://google.com';
    await addActionToIncident(page, { link: linkVal });

    // Edit the action
    const moreButton = await getDataTest(page, 'action__more');
    await moreButton.hover();
    
    const editButton = await getDataTest(page, 'action__edit');
    await editButton.click();

    // Update the link
    const newLinkVal = 'http://example.com';
    const linkField = await getDataTest(page, 'new-action__link');
    await linkField.clear();
    await linkField.fill(newLinkVal);
    
    // Submit the form
    const submitButton = await getDataTest(page, 'action-form__submit');
    await submitButton.click();

    // Verify the link was updated
    const linkElement = await getDataTest(page, 'active_action__link');
    await expect(linkElement).toHaveAttribute('href', newLinkVal);
  });

  test('lets you add, edit, and remove timeline entries for the action, and it paginates them', async ({ page }) => {
    // Add an action
    await addActionToIncident(page, { what: 'Some Action' });
    
    // Verify initial state - should have one item (the input box)
    const timelineItems = await getDataTest(page, 'action__timeline', 'li');
    await expect(timelineItems).toHaveCount(1);

    // Add a timeline entry
    const timelineInput = await getDataTest(page, 'action__timeline_form__text');
    await expect(timelineInput).toHaveValue('');
    await timelineInput.fill('Note A');
    await page.keyboard.press('Enter');
    
    // Verify the entry was added and input was cleared
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note A');
    await expect(timelineInput).toHaveValue('');

    // Verify expand/collapse buttons don't exist yet
    await expect(await page.locator('[data-test="action__timeline__expand_button"]')).not.toBeVisible();
    await expect(await page.locator('[data-test="action__timeline__collapse_button"]')).not.toBeVisible();

    // Add two more entries
    await timelineInput.fill('Note B');
    await page.keyboard.press('Enter');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note B');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note A');
    
    await timelineInput.fill('Note C');
    await page.keyboard.press('Enter');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note C');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note B');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note A');
    
    // Verify expand/collapse buttons still don't exist
    await expect(await page.locator('[data-test="action__timeline__expand_button"]')).not.toBeVisible();
    await expect(await page.locator('[data-test="action__timeline__collapse_button"]')).not.toBeVisible();

    // Add a fourth entry - this should trigger pagination
    await timelineInput.fill('Note D');
    await page.keyboard.press('Enter');
    
    // Verify Note D, C, and B are visible, but A is not
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note D');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note C');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note B');
    await expect(await getDataTest(page, 'action__timeline')).not.toContainText('Note A');
    
    // Verify expand button is visible but collapse is not
    const expandButton = await getDataTest(page, 'action__timeline__expand_button');
    await expect(expandButton).toBeVisible();
    await expect(await page.locator('[data-test="action__timeline__collapse_button"]')).not.toBeVisible();

    // Click expand button
    await expandButton.click();
    
    // Verify all notes are visible
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note A');
    
    // Verify collapse button is visible but expand is not
    const collapseButton = await getDataTest(page, 'action__timeline__collapse_button');
    await expect(collapseButton).toBeVisible();
    await expect(await page.locator('[data-test="action__timeline__expand_button"]')).not.toBeVisible();

    // Click collapse button
    await collapseButton.click();
    
    // Verify Note A is hidden again
    await expect(await getDataTest(page, 'action__timeline')).not.toContainText('Note A');
    await expect(await page.locator('[data-test="action__timeline__collapse_button"]')).not.toBeVisible();
    await expect(await getDataTest(page, 'action__timeline__expand_button')).toBeVisible();

    // Delete a timeline entry
    const timelineEntries = await getDataTest(page, 'action__timeline__entry');
    await timelineEntries.first().hover();
    
    const deleteButton = await getDataTest(page, 'action__timeline__entry__delete');
    await deleteButton.click();
    
    // Verify Note D is gone and Note A is back
    await expect(await getDataTest(page, 'action__timeline')).not.toContainText('Note D');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note C');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note B');
    await expect(await getDataTest(page, 'action__timeline')).toContainText('Note A');

    // Edit a timeline entry
    const updatedTimelineEntries = await getDataTest(page, 'action__timeline__entry');
    // Get the first entry using nth(0) instead of first()
    await updatedTimelineEntries.nth(0).hover();
    
    const editEntryButton = await getDataTest(page, 'action__timeline__entry__edit');
    await editEntryButton.click();
    
    // Update the text and timestamp
    const entryTextField = await getDataTest(page, 'action__timeline__entry__form__text');
    await entryTextField.clear();
    await entryTextField.fill('Updated Note C Text');
    
    const entryTimestampField = await getDataTest(page, 'action__timeline__entry__form__timestamp');
    await entryTimestampField.clear();
    await entryTimestampField.fill('Updated Note C Timestamp Value');
    
    const entrySubmitButton = await getDataTest(page, 'action__timeline__entry__form__submit');
    await entrySubmitButton.click();
    
    // Verify the entry was updated
    const entryTextElements = await getDataTest(page, 'action__timeline__entry__text');
    await expect(entryTextElements.nth(0)).toHaveText('Updated Note C Text');
    
    const entryTimestampElements = await getDataTest(page, 'action__timeline__entry__timestamp');
    await expect(entryTimestampElements.nth(0)).toHaveText('Updated Note C Timestamp Value');
  });
});
