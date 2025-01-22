import { test, expect } from '@playwright/test';
import { Chat } from './Chat';

test('renders intro message', async ({ page }) => {
  const chat = new Chat(page);
  await chat.goto();

  expect(chat.messageContainer).not.toBeNull();

  await expect(page.getByText("let's get started")).toBeVisible();

  await expect(
    page.getByText(
      "Tell me about your memecoin idea below and we'll generate everything you need to get it launched.",
    ),
  ).toBeVisible();
});

test('receiving a response from the model', async ({ page }) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.submitMessage(
    'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
  );

  await chat.waitForStreamToFinish();
  await chat.waitForAssistantResponse();

  const messages = await chat.getMessageElementsWithContent();
  expect(messages.length).toBeGreaterThan(0);

  const attr =
    await messages[messages.length - 1].getAttribute('data-chat-role');
  expect(attr).toBe('assistant');

  const responseText = await messages[messages.length - 1].innerText();
  expect(responseText).toMatch(/THIS IS A TEST/i);
});
