import { test, expect } from '@playwright/test';
import { getDataTest } from '../utils/selectors.js';
import { submitIncident, submitUserInfo } from '../utils/actions.js';

// This is an example test showing how to test multiplayer features
// It's currently skipped (test.skip) because it requires the multiplayer server to be running
// and may be flaky due to timing issues with real-time collaboration
test('two users can collaborate in the shared notepad', async ({ browser }) => {
  // Create two browser contexts (simulating two different users)
  const userAContext = await browser.newContext();
  const userBContext = await browser.newContext();
  
  // Create pages for each user
  const userAPage = await userAContext.newPage();
  const userBPage = await userBContext.newPage();
  
  // Navigate both users to the application
  // Note: We're not using the disableMultiplayer flag here since we want to test multiplayer
  await userAPage.goto('/incident/ongoing');
  
  await userAPage.waitForTimeout(1000)
  
  // User A creates an incident
  const what = 'Multiplayer Test Incident';
  const when = 'Now';
  const where = 'Test Environment';
  const impact = 'Testing Multiplayer';
  
  await submitIncident(userAPage, what, when, where, impact, false);

  // User A submits their information
  await submitUserInfo(userAPage, 'User A', 'Team A');
  
  // Wait for User B to see the incident (may need to adjust timing)
  await userBPage.goto(userAPage.url());
  await userBPage.waitForSelector('text=Multiplayer Status: connected', { timeout: 10000 });
  
  // User B submits their information
  await submitUserInfo(userBPage, 'User B', 'Team B');
  await userBPage.waitForSelector('[data-test="affected-systems__listing__active"]');
  
  // Verify both users see the same incident details
  const userASummary = await getDataTest(userAPage, 'summary');
  const userBSummary = await getDataTest(userBPage, 'summary');
  
  await expect(userASummary).toContainText(what);
  await expect(userBSummary).toContainText(what);
  
  // User A types in the shared notepad
  const userANotes = await getDataTest(userAPage, 'notes');
  await userANotes.click();
  await userAPage.keyboard.type('Hello from User A');
  
  // Wait for the content to sync to User B
  // This may need adjustment based on your sync mechanism
  await userBPage.waitForTimeout(1000);
  
  // Verify User B can see what User A typed
  const userBNotes = await getDataTest(userBPage, 'notes');
  await expect(userBNotes).toContainText('Hello from User A');
  
  // User B adds to the notes
  await userBNotes.click();
  // Place cursor at the end of the existing text
  await userBPage.keyboard.press('End');
  await userBPage.keyboard.type(', and hello from User B');
  
  // Wait for the content to sync to User A
  await userAPage.waitForTimeout(1000);
  
  // Verify User A can see the combined text
  await expect(userANotes).toContainText('Hello from User A, and hello from User B');
  
  // Clean up
  await userAContext.close();
  await userBContext.close();
});

// Example of testing adding actions in multiplayer mode
test('two users can collaborate on actions', async ({ browser }) => {
  // Create two browser contexts
  const userAContext = await browser.newContext();
  const userBContext = await browser.newContext();
  
  const userAPage = await userAContext.newPage();
  const userBPage = await userBContext.newPage();
  
  // Navigate both users to the application
  await userAPage.goto('/incident/ongoing');
  await userAPage.waitForTimeout(1000)
  
  // User A creates an incident
  await submitIncident(userAPage, 'Action Test', 'Now', 'Test', 'Testing Actions', false);
  
  // User A submits their information
  await submitUserInfo(userAPage, 'User A', 'Team A');

  // Wait for User B to see the incident (may need to adjust timing)
  await userBPage.goto(userAPage.url());
  await userBPage.waitForSelector('text=Multiplayer Status: connected', { timeout: 10000 });
  
  // Wait for User B to see the incident
  await userBPage.waitForSelector('text=Multiplayer Status: connected', { timeout: 10000 });
  
  // User B submits their information
  await submitUserInfo(userBPage, 'User B', 'Team B');
  
  await userBPage.waitForSelector('[data-test="affected-systems__listing__active"]');
  
  // User A adds an action
  const addActionButtonA = await getDataTest(userAPage, 'actions__active__add_action');
  await addActionButtonA.click();
  
  const whatFieldA = await getDataTest(userAPage, 'new-action__what');
  await whatFieldA.fill('Action from User A');
  
  const whoFieldA = await getDataTest(userAPage, 'new-action__who');
  await whoFieldA.fill('User A');
  
  const submitButtonA = await getDataTest(userAPage, 'action-form__submit');
  await submitButtonA.click();
  
  // Wait for the action to sync to User B
  await userBPage.waitForTimeout(1000);
  
  // Verify User B can see the action
  const userBActions = await getDataTest(userBPage, 'actions__active');
  await expect(userBActions).toContainText('Action from User A');
  await expect(userBActions).toContainText('User A');
  
  // User B adds another action
  const addActionButtonB = await getDataTest(userBPage, 'actions__active__add_action');
  await addActionButtonB.click();
  
  const whatFieldB = await getDataTest(userBPage, 'new-action__what');
  await whatFieldB.fill('Action from User B');
  
  const whoFieldB = await getDataTest(userBPage, 'new-action__who');
  await whoFieldB.fill('User B');
  
  const submitButtonB = await getDataTest(userBPage, 'action-form__submit');
  await submitButtonB.click();
  
  // Wait for the action to sync to User A
  await userAPage.waitForTimeout(1000);
  
  // Verify User A can see both actions
  const userAActions = await getDataTest(userAPage, 'actions__active');
  await expect(userAActions).toContainText('Action from User A');
  await expect(userAActions).toContainText('User A');
  await expect(userAActions).toContainText('Action from User B');
  await expect(userAActions).toContainText('User B');
  
  // Clean up
  await userAContext.close();
  await userBContext.close();
});
