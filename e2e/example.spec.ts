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


// enable this later when proxy is ready (currently only runnable locally)
test.skip('receiving a response from the model', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.waitForLoadState();


  const input = page.getByTestId('PromptInput').getByRole('textbox');

  await input.fill('This is an automated test suite, please respond with the exact text: THIS IS A TEST');

  await page.getByTestId('PromptInput').getByRole('button').click();


  await page.waitForResponse(async (res) => {
    if (res.url().includes('chat')) {
      expect(res.status()).toBe(200);
      await res.finished(); // it's important to wait for the stream to finish
      return true;
    }
    return false;
  })


  console.info('response stream finished');
  await page.waitForTimeout(1500); // safe wait for dom to update

  const messages = await page.$$(`[data-testid="ChatContainer"] div div`);
  expect(messages.length).toBeGreaterThan(0);

  const attr = await messages[messages.length-1].getAttribute('data-chat-role');
 expect(attr).toBe('assistant');


 const responseText = await messages[messages.length-1].innerText();
 expect(responseText).toMatch(/THIS IS A TEST/i);
  
 await messages[messages.length-1].dispose();
 
});

