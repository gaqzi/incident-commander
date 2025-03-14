import { getDataTest } from './selectors.js';

/**
 * Submits a new incident with the provided details
 * @param {import('@playwright/test').Page} page - The page to interact with
 * @param {string} what - What happened
 * @param {string} when - When it happened
 * @param {string} where - Where it happened
 * @param {string} impact - The impact of the incident
 * @param {boolean} shouldUseDefaultActions - Whether to use default actions
 */
export async function submitIncident(page, what, when, where, impact, shouldUseDefaultActions) {
  const whatField = await getDataTest(page, 'summary__input__what');
  await whatField.fill(what);
  
  const whenField = await getDataTest(page, 'summary__input__when');
  await whenField.clear();
  await whenField.fill(when);
  
  const whereField = await getDataTest(page, 'summary__input__where');
  await whereField.fill(where);
  
  const impactField = await getDataTest(page, 'summary__input__impact');
  await impactField.fill(impact);
  
  // Add a retry mechanism for checkbox operations which can be flaky in Firefox
  const defaultActionsCheckbox = await getDataTest(page, 'summary__add-default-actions');
  
  // Force the checkbox to have the correct state using JavaScript
  if (shouldUseDefaultActions) {
    // Try normal check first
    try {
      await defaultActionsCheckbox.check({ timeout: 5000 });
    } catch (e) {
      // If normal check fails, try using JavaScript to set the checked state
      await page.evaluate(selector => {
        document.querySelector(selector).checked = true;
      }, '[data-test="summary__add-default-actions"]');
    }
  } else {
    // Try normal uncheck first
    try {
      await defaultActionsCheckbox.uncheck({ timeout: 5000 });
    } catch (e) {
      // If normal uncheck fails, try using JavaScript to set the checked state
      await page.evaluate(selector => {
        document.querySelector(selector).checked = false;
      }, '[data-test="summary__add-default-actions"]');
    }
  }
  
  const submitButton = await getDataTest(page, 'summary__submit');
  await submitButton.click();

  await page.waitForSelector('[data-test="affected-systems__listing__active"]', { timeout: 10000 });
}

/**
 * Adds a resource link to the incident
 * @param {import('@playwright/test').Page} page - The page to interact with
 * @param {string} name - The name of the resource
 * @param {string} url - The URL of the resource
 */
export async function addResourceLink(page, name, url) {
  const addButton = await getDataTest(page, 'button-add-resource');
  await addButton.click();
  
  const nameField = await getDataTest(page, 'resource-link__name');
  await nameField.clear();
  await nameField.fill(name);
  
  const urlField = await getDataTest(page, 'resource-link__url');
  await urlField.clear();
  await urlField.fill(url);
  
  const submitButton = await getDataTest(page, 'resource-link__submit');
  await submitButton.click();
}

/**
 * Adds an action to the incident
 * @param {import('@playwright/test').Page} page - The page to interact with
 * @param {Object} options - The action details
 * @param {string} [options.what='action-what'] - What the action is
 * @param {string} [options.who='action-who'] - Who is responsible for the action
 * @param {string} [options.link='http://example.com'] - Link related to the action
 * @param {number} [options.minutes=10] - Minutes between updates
 */
export async function addActionToIncident(page, { what = 'action-what', who = 'action-who', link = 'http://example.com', minutes = 10 }) {
  const addButton = await getDataTest(page, 'actions__active__add_action');
  await addButton.click();
  
  const whatField = await getDataTest(page, 'new-action__what');
  await whatField.fill(what);
  
  const whoField = await getDataTest(page, 'new-action__who');
  await whoField.fill(who);
  
  const linkField = await getDataTest(page, 'new-action__link');
  await linkField.fill(link);
  
  const minutesField = await getDataTest(page, 'new-action__minutes-between-updates');
  await minutesField.clear();
  await minutesField.fill(String(minutes));
  
  const submitButton = await getDataTest(page, 'action-form__submit');
  await submitButton.click();
}

/**
 * Submits user information in the user form
 * @param {import('@playwright/test').Page} page - The page to interact with
 * @param {string} name - User's name
 * @param {string} team - User's team
 */
export async function submitUserInfo(page, name, team) {
  // Fill in the form
  const nameField = await page.locator('input[placeholder="Enter your name"]');
  await nameField.fill(name);
  
  const teamField = await page.locator('input[placeholder="Enter your team"]');
  await teamField.fill(team);
  
  // Submit the form
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
}
