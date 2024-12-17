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

  const messages = await chat.messageContainer.all();
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

test.skip('image generation and editing', async ({ page }) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.submitMessage('Make me a giraffe-themed meme coin');

  await chat.waitForStreamToFinish();

  //  loading state begins
  await expect(
    page.locator('h3', { hasText: 'Generating Token Metadata' }),
  ).toBeVisible();

  await chat.waitForAssistantResponse();

  //  loading state is finished
  await expect(
    page.locator('h3', { hasText: 'Generating Token Metadata' }),
  ).not.toBeVisible();

  const initialTokenName = page.locator('h3', { hasText: 'Name:' }).first();
  const initialTokenSymbol = page.locator('h3', { hasText: 'Symbol:' }).first();
  const initialTokenDescription = page
    .locator('h3', { hasText: 'Description' })
    .locator('+ p')
    .first();
  const initialTokenImage = page
    .locator('img[alt="Model Generated Image"]')
    .first();
  const initialTokenImageSrc = await initialTokenImage.getAttribute('src');

  await expect(initialTokenName).toBeVisible();
  await expect(initialTokenSymbol).toBeVisible();
  await expect(initialTokenDescription).toBeVisible();
  await expect(initialTokenImage).toBeVisible();

  //  edit some of the token metadata
  await chat.submitMessage(
    'Keep all metadata the same, but generate a new image',
  );

  await chat.waitForAssistantResponse();

  const updatedTokenName = page.locator('h3', { hasText: 'Name:' }).nth(1);
  const updatedTokenSymbol = page.locator('h3', { hasText: 'Symbol:' }).nth(1);
  const updatedTokenDescription = page
    .locator('h3', { hasText: 'Description' })
    .locator('+ p')
    .nth(1);
  const updatedTokenImage = page
    .locator('img[alt="Model Generated Image"]')
    .nth(1);
  const updatedTokenImageSrc = await updatedTokenImage.getAttribute('src');

  expect(await updatedTokenName.textContent()).toBe(
    await initialTokenName.textContent(),
  );
  expect(await updatedTokenSymbol.textContent()).toBe(
    await initialTokenSymbol.textContent(),
  );
  expect(await updatedTokenDescription.textContent()).toBe(
    await initialTokenDescription.textContent(),
  );
  expect(updatedTokenImageSrc).not.toBe(initialTokenImageSrc);

  // //  edit all the token metadata
  await chat.submitMessage(
    'Generate an entirely new, non-giraffe themed meme coin',
  );

  await chat.waitForAssistantResponse();

  const anotherTokenName = page.locator('h3', { hasText: 'Name:' }).nth(2);
  const anotherTokenSymbol = page.locator('h3', { hasText: 'Symbol:' }).nth(2);
  const anotherTokenDescription = page
    .locator('h3', { hasText: 'Description' })
    .locator('+ p')
    .nth(2);
  const anotherTokenImage = page
    .locator('img[alt="Model Generated Image"]')
    .nth(2);
  const anotherTokenImageSrc = await anotherTokenImage.getAttribute('src');

  expect(await anotherTokenName.textContent()).not.toBe(
    await updatedTokenName.textContent(),
  );
  expect(await anotherTokenSymbol.textContent()).not.toBe(
    await updatedTokenSymbol.textContent(),
  );
  expect(await anotherTokenDescription.textContent()).not.toBe(
    await updatedTokenDescription.textContent(),
  );
  expect(anotherTokenImageSrc).not.toBe(updatedTokenImageSrc);
});

test('handles cancelling an in progress token metadata request', async ({
  page,
}) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.submitMessage('Make me a giraffe-themed meme coin');

  const messages = await page.$$('[data-testid="conversation"]');

  //  Streaming begins
  expect(await messages[messages.length - 1].textContent()).toMatch(
    /Thinking/i,
  );

  //  allow everything but the image to be set
  await chat.waitForStreamToFinish();

  const messagesDuringImageGeneration = await page.$$(
    '[data-testid="conversation"]',
  );

  expect(
    await messagesDuringImageGeneration[
      messagesDuringImageGeneration.length - 1
    ].textContent(),
  ).toMatch(/Generating image/i);

  //  click cancel icon
  await page.getByTestId('chat-view-button').click();

  const messagesAfterCancel = await page.$$('[data-testid="conversation"]');

  expect(
    await messagesAfterCancel[messagesAfterCancel.length - 1].textContent(),
  ).toMatch(/Request was aborted/i);
});
