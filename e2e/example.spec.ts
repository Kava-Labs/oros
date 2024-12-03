import { test, expect } from '@playwright/test';

test('renders intro message', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.waitForLoadState();

  const messageContainer = await page.$(`[data-testid="ChatContainer"] div div`);
  expect(messageContainer).not.toBeNull();

  const role = await messageContainer!.getAttribute('data-chat-role')
  expect(role).toBe('assistant');

  // don't reference messageContainer after calling dispose
  // https://playwright.dev/docs/api/class-elementhandle
  // preferable we use Locators but they aren't always usable for certain elements
  await messageContainer!.dispose();

  await expect(page.getByTestId('ChatContainer')).toHaveText(/Hey I'm Kava AI/, { useInnerText: true });

});
