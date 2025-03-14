/**
 * Helper function to get elements by data-test attribute
 * @param {import('@playwright/test').Page | import('@playwright/test').Locator} context - The page or locator to search within
 * @param {string | string[]} ids - The data-test ID or array of IDs
 * @param {string} suffix - Optional CSS selector suffix
 * @returns {import('@playwright/test').Locator} - The located element(s)
 */
export async function getDataTest(context, ids, suffix = '') {
  let selector = `[data-test="${ids}"]`;
  if (Array.isArray(ids)) {
    selector = ids.reduce((accum, id) => accum + `[data-test="${id}"] `, '');
  }
  if (suffix !== '') {
    return context.locator(`${selector} ${suffix}`);
  }
  return context.locator(selector);
}
