import { test, expect } from '@playwright/test';

test('renders correct title', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Kava Chat Bot/);
});
