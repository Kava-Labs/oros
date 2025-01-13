import { test, expect } from '@playwright/test';
import { memeCoinSystemPrompt } from '../src/config';
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
        content: memeCoinSystemPrompt,
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
        content: memeCoinSystemPrompt,
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

test('image generation and editing', async ({ page }) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  await chat.submitMessage('Make me a giraffe-themed meme coin');

  await chat.waitForStreamToFinish();

  //  loading state begins
  const loadingSpinner = await page.locator('div[role="status"]');
  await expect(loadingSpinner).toBeVisible();

  await chat.waitForImageGenerationToFinish();

  const initialTokenCardTitle = await page.locator('h4').first().textContent();
  //  get the text content of the p tag after the label
  const initialTokenInfo = await page
    .locator('h6', { hasText: 'Token info' })
    .locator('+ p')
    .first()
    .textContent();
  const initialTokenImage = page
    .locator('img[alt="Model Generated Image"]')
    .first();
  const initialTokenImageSrc = await initialTokenImage.getAttribute('src');

  await expect(initialTokenImage).toBeVisible();

  await chat.waitForStreamToFinish();

  await chat.waitForAssistantResponse();

  //  edit some of the token metadata
  await chat.submitMessage(
    'Keep all metadata the same, but generate a new image',
  );

  //  non-image metadata completes
  await chat.waitForStreamToFinish();
  //  image generation completes
  await chat.waitForImageGenerationToFinish();
  //  follow-up chat completes
  await chat.waitForStreamToFinish();

  const updatedTokenCardTitle = await page.locator('h4').nth(1).textContent();
  const updatedTokenInfo = await page
    .locator('h6', { hasText: 'Token info' })
    .locator('+ p')
    .nth(1)
    .textContent();
  const updatedTokenImage = page
    .locator('img[alt="Model Generated Image"]')
    .nth(1);
  const updatedTokenImageSrc = await updatedTokenImage.getAttribute('src');

  expect(initialTokenCardTitle).toBe(updatedTokenCardTitle);
  expect(initialTokenInfo).toBe(updatedTokenInfo);
  expect(updatedTokenImageSrc).not.toBe(initialTokenImageSrc);

  //  specify a theme for the coin - occasionally the tool call won't be made
  //  and it will ask for more info about what the user wants
  await chat.submitMessage('Make me an entirely-new memecoin about frogs');

  await chat.waitForStreamToFinish();
  await chat.waitForImageGenerationToFinish();
  await chat.waitForStreamToFinish();

  const thirdTokenCardTitle = await page.locator('h4').nth(2).textContent();
  const thirdTokenInfo = await page
    .locator('h6', { hasText: 'Token info' })
    .locator('+ p')
    .nth(2)
    .textContent();
  const thirdTokenImage = page
    .locator('img[alt="Model Generated Image"]')
    .nth(2);
  const thirdTokenImgSrc = await thirdTokenImage.getAttribute('src');

  expect(thirdTokenInfo).not.toBe(updatedTokenInfo);
  expect(thirdTokenCardTitle).not.toBe(updatedTokenCardTitle);
  expect(thirdTokenImgSrc).not.toBe(updatedTokenImageSrc);
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

test('shows original address in UI but sends masked version to API', async ({
  page,
}) => {
  test.setTimeout(90 * 1000);

  const chat = new Chat(page);
  await chat.goto();

  //
  let requestBody;
  await page.route('**/chat/completions', async (route) => {
    const request = route.request();
    requestBody = request.postData();
    await route.continue();
  });

  const firstAddress = '0xc07918e451ab77023a16fa7515dd60433a3c771d';
  await chat.submitMessage(`Send 10 KAVA to ${firstAddress}`);
  await chat.waitForStreamToFinish();
  await chat.waitForAssistantResponse();

  let messages = await chat.getMessageElementsWithContent();
  let userMessage = messages[messages.length - 2];
  let messageText = await userMessage.innerText();
  expect(messageText).toMatch(`Send 10 KAVA to ${firstAddress}`);

  let parsedRequest = JSON.parse(requestBody);
  let userMessages = parsedRequest.messages.filter((m) => m.role === 'user');
  let sentMessage = userMessages[userMessages.length - 1].content;
  expect(sentMessage).toMatch('Send 10 KAVA to address_1');
  expect(sentMessage).not.toContain(firstAddress);

  // Second Message - new address
  const secondResponsePromise = page.waitForResponse(async (res) => {
    if (res.url().includes('completions')) {
      requestBody = await res.request().postData();
      expect(res.status()).toBe(200);
      await res.finished();
      return true;
    }
    return false;
  });

  const secondAddress = '0xd8e30f7bcb5211e591bbc463cdab0144e82dffe5';
  await chat.submitMessage(`Send 10 KAVA to ${secondAddress}`);
  await secondResponsePromise;
  await chat.waitForAssistantResponse();

  messages = await chat.getMessageElementsWithContent();
  userMessage = messages[messages.length - 2];
  messageText = await userMessage.innerText();
  expect(messageText).toMatch(`Send 10 KAVA to ${secondAddress}`);

  parsedRequest = JSON.parse(requestBody);
  userMessages = parsedRequest.messages.filter((m) => m.role === 'user');
  sentMessage = userMessages[userMessages.length - 1].content;
  expect(sentMessage).toMatch('Send 10 KAVA to address_2');
  expect(sentMessage).not.toContain(secondAddress);

  // Third Message - Reusing first address
  const thirdResponsePromise = page.waitForResponse(async (res) => {
    if (res.url().includes('completions')) {
      requestBody = await res.request().postData();
      expect(res.status()).toBe(200);
      await res.finished();
      return true;
    }
    return false;
  });

  await chat.submitMessage(`Send 10 KAVA to ${firstAddress}`);
  await thirdResponsePromise;
  await chat.waitForAssistantResponse();

  messages = await chat.getMessageElementsWithContent();
  userMessage = messages[messages.length - 2];
  messageText = await userMessage.innerText();
  expect(messageText).toMatch(`Send 10 KAVA to ${firstAddress}`);

  parsedRequest = JSON.parse(requestBody);
  userMessages = parsedRequest.messages.filter((m) => m.role === 'user');
  sentMessage = userMessages[userMessages.length - 1].content;
  expect(sentMessage).toContain('Send 10 KAVA to address_1');
  expect(sentMessage).not.toContain(firstAddress);
});
