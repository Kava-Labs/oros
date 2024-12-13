import { test, expect } from '@playwright/test';
import { systemPrompt } from '../src/config';

test('renders intro message', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.waitForLoadState();

  const messageContainer = await page.$(
    `[data-testid="ChatContainer"] div div`,
  );
  expect(messageContainer).not.toBeNull();

  const role = await messageContainer!.getAttribute('data-chat-role');
  expect(role).toBe('assistant');

  await expect(page.getByTestId('ChatContainer')).toHaveText(
    /Hey I'm Kava AI/,
    { useInnerText: true },
  );
});

test('receiving a response from the model', async ({ page }) => {
  test.setTimeout(90 * 1000);
  await page.goto('http://localhost:3000/');

  await page.waitForLoadState();

  const input = page.getByTestId('PromptInput').getByRole('textbox');

  await input.fill(
    'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
  );

  await page.getByTestId('PromptInput').getByRole('button').click();

  await page.waitForResponse(async (res) => {
    if (res.url().includes('chat')) {
      expect(res.status()).toBe(200);
      await res.finished(); // it's important to wait for the stream to finish
      return true;
    }
    return false;
  });

  await page.waitForFunction(
    () => {
      const messages = document.querySelectorAll(
        '[data-testid="ChatContainer"] div div',
      );
      const lastMessage = messages[messages.length - 1];
      return (
        lastMessage &&
        lastMessage.getAttribute('data-chat-role') === 'assistant' &&
        (lastMessage.textContent?.length ?? 0) > 0
      );
    },
    {
      timeout: 10000,
      polling: 100,
    },
  );

  const messages = await page.$$(`[data-testid="ChatContainer"] div div`);
  expect(messages.length).toBeGreaterThan(0);

  const attr =
    await messages[messages.length - 1].getAttribute('data-chat-role');
  expect(attr).toBe('assistant');

  const responseText = await messages[messages.length - 1].innerText();
  expect(responseText).toMatch(/THIS IS A TEST/i);
});

test('fills in messages from local storage', async ({ page }) => {
  test.setTimeout(90 * 1000);

  await page.addInitScript(() => {
    localStorage.setItem(
      'chat-messages',
      JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'This message was loaded from  local storage',
          },
          {
            role: 'assistant',
            content: 'That is terrific!',
          },
        ],
      }),
    );
  });

  await page.goto('http://localhost:3000/');

  await page.waitForLoadState();

  const messages = await page.$$(`[data-testid="ChatContainer"] div div`);

  const userMessage = await messages[messages.length - 2].innerText();
  const responseMessage = await messages[messages.length - 1].innerText();

  expect(userMessage).toMatch(/This message was loaded from local storage/i);
  expect(responseMessage).toMatch(/That is terrific!/i);

  //  reload the page and verify the same messages are still present
  await page.reload();

  const messagesOnReload = await page.$$(
    `[data-testid="ChatContainer"] div div`,
  );

  const userMessageOnReload =
    await messagesOnReload[messagesOnReload.length - 2].innerText();
  const responseMessageOnReload =
    await messagesOnReload[messagesOnReload.length - 1].innerText();

  expect(userMessageOnReload).toMatch(
    /This message was loaded from local storage/i,
  );
  expect(responseMessageOnReload).toMatch(/That is terrific!/i);
});

test('messages from the chat populate local storage', async ({ page }) => {
  test.setTimeout(90 * 1000);
  await page.goto('http://localhost:3000/');

  await page.waitForLoadState();

  const input = page.getByTestId('PromptInput').getByRole('textbox');

  await input.fill(
    'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
  );

  await page.getByTestId('PromptInput').getByRole('button').click();

  await page.waitForResponse(async (res) => {
    if (res.url().includes('chat')) {
      expect(res.status()).toBe(200);
      await res.finished();
      return true;
    }
    return false;
  });

  //  wait for the assistant's reply to complete
  await page.waitForFunction(
    () => {
      const messages = document.querySelectorAll(
        '[data-testid="ChatContainer"] div div',
      );
      const lastMessage = messages[messages.length - 1];
      return (
        lastMessage &&
        lastMessage.getAttribute('data-chat-role') === 'assistant' &&
        (lastMessage.textContent?.length ?? 0) > 0
      );
    },
    {
      timeout: 10000,
      polling: 100,
    },
  );

  const storedMessageHistory = await page.evaluate(() =>
    localStorage.getItem('chat-messages'),
  );

  expect(JSON.parse(storedMessageHistory)).toStrictEqual({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content:
          'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
      },
      {
        role: 'assistant',
        content: 'THIS IS A TEST',
      },
    ],
  });
});

test('clicking "reset chat" clears "chatMessages" from local storage', async ({
  page,
}) => {
  test.setTimeout(90 * 1000);
  await page.goto('http://localhost:3000/');

  await page.waitForLoadState();

  const input = page.getByTestId('PromptInput').getByRole('textbox');

  await input.fill(
    'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
  );

  await page.getByTestId('PromptInput').getByRole('button').click();

  await page.waitForResponse(async (res) => {
    if (res.url().includes('chat')) {
      expect(res.status()).toBe(200);
      await res.finished();
      return true;
    }
    return false;
  });

  //  wait for the assistant's reply to complete
  await page.waitForFunction(
    () => {
      const messages = document.querySelectorAll(
        '[data-testid="ChatContainer"] div div',
      );
      const lastMessage = messages[messages.length - 1];
      return (
        lastMessage &&
        lastMessage.getAttribute('data-chat-role') === 'assistant' &&
        (lastMessage.textContent?.length ?? 0) > 0
      );
    },
    {
      timeout: 10000,
      polling: 100,
    },
  );

  const storedMessageHistory = await page.evaluate(() =>
    localStorage.getItem('chat-messages'),
  );

  expect(JSON.parse(storedMessageHistory)).toStrictEqual({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content:
          'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
      },
      {
        role: 'assistant',
        content: 'THIS IS A TEST',
      },
    ],
  });

  await page
    .getByRole('button', {
      name: 'Reset Chat',
    })
    .click();

  const updatedLocalStorage = await page.evaluate(() =>
    localStorage.getItem('chat-messages'),
  );

  expect(JSON.parse(updatedLocalStorage)).toBeNull();
});
