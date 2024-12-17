import { test, expect } from '@playwright/test';
import { systemPrompt } from '../src/config';
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

// skipped because we disabled local storage
test.skip('fills in messages from local storage to the UI, which persist on browser refresh', async ({
  page,
}) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.setMessagesInStorage([
    {
      role: 'user',
      content: 'This message was loaded from local storage',
    },
    {
      role: 'assistant',
      content: 'That is terrific!',
    },
  ]);

  await chat.goto();

  const messages = await chat.messageContainer.all();
  const userMessage = await messages[messages.length - 2].textContent();
  const responseMessage = await messages[messages.length - 1].textContent();

  expect(userMessage).toMatch(/This message was loaded from local storage/i);
  expect(responseMessage).toMatch(/That is terrific!/i);

  //  reload the page and verify the same messages are still present
  await page.reload();

  const messagesOnReload = await chat.messageContainer.all();
  const userMessageOnReload =
    await messagesOnReload[messagesOnReload.length - 2].innerText();
  const responseMessageOnReload =
    await messagesOnReload[messagesOnReload.length - 1].innerText();

  expect(userMessageOnReload).toMatch(
    /This message was loaded from local storage/i,
  );
  expect(responseMessageOnReload).toMatch(/That is terrific!/i);
});

// skipped because we disabled local storage
test.skip('messages from the UI populate local storage', async ({ page }) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.submitMessage(
    'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
  );

  await chat.waitForStreamToFinish();
  await chat.waitForAssistantResponse();

  const messageHistory = await chat.getMessageHistoryFromStorage();
  expect(JSON.parse(messageHistory!)).toStrictEqual({
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

// skipped because we disabled local storage
test.skip('clicking reset chat button clears chatMessages from local storage', async ({
  page,
}) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.submitMessage(
    'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
  );

  await chat.waitForStreamToFinish();
  await chat.waitForAssistantResponse();

  const messageHistory = await chat.getMessageHistoryFromStorage();
  expect(JSON.parse(messageHistory!)).toStrictEqual({
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

  const updatedLocalStorage = await chat.getMessageHistoryFromStorage();
  expect(updatedLocalStorage).toBeNull();
});

//  todo - address timeout issue occurring in build, but not locally
test.skip('image generation and editing', async ({ page }) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.submitMessage('Make me a giraffe-themed meme coin');

  await chat.waitForStreamToFinish();

  //  loading state begins
  const loadingSpinner = await page.locator('div[role="status"]');
  await expect(loadingSpinner).toBeVisible();

  await chat.waitForAssistantResponse();

  const initialTokenImage = page
    .locator('img[alt="Model Generated Image"]')
    .first();
  const initialTokenImageSrc = await initialTokenImage.getAttribute('src');

  await expect(initialTokenImage).toBeVisible();

  await chat.waitForAssistantResponse();

  //  edit some of the token metadata
  await chat.submitMessage(
    'Keep all metadata the same, but generate a new image',
  );

  await chat.waitForAssistantResponse();

  //  todo - assertions symbol and description?
  const updatedTokenImage = page
    .locator('img[alt="Model Generated Image"]')
    .nth(1);
  const updatedTokenImageSrc = await updatedTokenImage.getAttribute('src');

  expect(updatedTokenImageSrc).not.toBe(initialTokenImageSrc);

  //  todo - edit all token metadata
});

test('handles cancelling an in progress token metadata request', async ({
  page,
}) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.submitMessage('Make me a giraffe-themed meme coin');

  let messageElements = await chat.getMessageElementsWithContent();

  //  Streaming begins
  expect(
    await messageElements[messageElements.length - 1].textContent(),
  ).toMatch(/Thinking/i);

  //  allow everything but the image to be set
  await chat.waitForStreamToFinish();

  //  get the updated messages
  messageElements = await chat.getMessageElementsWithContent();

  expect(
    await messageElements[messageElements.length - 1].textContent(),
  ).toMatch(/Generating image/i);

  //  click cancel icon
  await page.getByTestId('chat-view-button').click();

  messageElements = await chat.getMessageElementsWithContent();

  expect(
    await messageElements[messageElements.length - 1].textContent(),
  ).toMatch(/Request was aborted/i);
});
