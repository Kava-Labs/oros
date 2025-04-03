import { expect, test } from '@playwright/test';
import { Chat } from './Chat';
import * as fs from 'fs';
import { join } from 'path';

const { describe } = test;

describe('chat', () => {
  test('renders intro messages by model', async ({ page }) => {
    const initialIntroMessage = 'What can I help you with?';
    const chat = new Chat(page);
    await chat.goto();

    expect(chat.messageContainer).not.toBeNull();
    await expect(page.getByText(initialIntroMessage)).toBeVisible();
  });

  test('receiving a response from the model', async ({ page }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    await chat.submitMessage(
      'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
    );

    await chat.waitForStreamToFinish();

    const messages = await chat.getMessageElementsWithContent();
    const messageCount = await messages.count();

    expect(messageCount).toBeGreaterThan(0);

    const attr = await messages
      .nth(messageCount - 1)
      .getAttribute('data-chat-role');
    expect(attr).toBe('assistant');

    const responseText = await messages.nth(messageCount - 1).innerText();
    expect(responseText).toMatch(/THIS IS A TEST/i);
  });

  test('chat history', async ({ page }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    await chat.submitMessage(
      'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
    );

    await chat.waitForStreamToFinish();
    await chat.waitForSummarizationToFinish();

    const initialHistoryTitle = await page
      .getByTestId('chat-history-entry')
      .first()
      .textContent();

    expect(initialHistoryTitle).not.toBe('');

    const newChatIcon = page.getByRole('button', { name: 'New Chat' });
    await newChatIcon.click();

    await chat.submitMessage(
      'Can you help me move my blockchain asset from one chain to another?',
    );

    await chat.waitForStreamToFinish();
    await chat.waitForSummarizationToFinish();

    //  Switching between conversation histories
    let blockchainQuestionConversation =
      await chat.getMessageElementsWithContent();
    let messageCount = await blockchainQuestionConversation.count();
    const blockchainQuestionConversationResponse =
      await blockchainQuestionConversation.nth(messageCount - 1).innerText();

    const thisIsATestConversation = page
      .getByTestId('chat-history-entry')
      .nth(1);

    await thisIsATestConversation.click();

    const currentInViewConversation =
      await chat.getMessageElementsWithContent();
    messageCount = await currentInViewConversation.count();
    const currentInViewResponse = await currentInViewConversation
      .nth(messageCount - 1)
      .innerText();

    expect(currentInViewResponse).not.toBe(
      blockchainQuestionConversationResponse,
    );

    //  switch back to the initial conversation
    const blockChainHistoryItem = page
      .getByTestId('chat-history-entry')
      .first();

    await blockChainHistoryItem.click();

    blockchainQuestionConversation = await chat.getMessageElementsWithContent();

    messageCount = await blockchainQuestionConversation.count();
    const newBlockchainQuestionConversationResponse =
      await blockchainQuestionConversation.nth(messageCount - 1).innerText();

    expect(newBlockchainQuestionConversationResponse).toBe(
      blockchainQuestionConversationResponse,
    );

    // Deleting entries
    let historyEntryTexts = await page.getByTestId('chat-history-entry').all();
    expect(historyEntryTexts).toHaveLength(2);

    const chatOptionButtons = await page.getByLabel('Chat Options').all();
    expect(chatOptionButtons).toHaveLength(2);

    // Get the first chat history entry Chat Option button
    const firstChatOptionButton = chatOptionButtons[0];

    // Find and click the "Chat Options" button inside the first entry
    await firstChatOptionButton.click();

    await page.locator(`[aria-label="Delete Chat"]`).first().click();
    await historyEntryTexts[1].waitFor({ state: 'detached' });
    historyEntryTexts = await page.getByTestId('chat-history-entry').all();

    expect(historyEntryTexts).toHaveLength(1);

    // Get the only remaining chat history entry Chat Option button
    const lastChatOptionButton = chatOptionButtons[0];

    // Find and click the "Chat Options" button inside the first entry
    await lastChatOptionButton.click();
    await page.locator(`[aria-label="Delete Chat"]`).first().click();
    await historyEntryTexts[0].waitFor({ state: 'detached' });
    historyEntryTexts = await page.getByTestId('chat-history-entry').all();
    expect(historyEntryTexts).toHaveLength(0);
    await expect(page.getByText('Start a new chat to begin')).toBeVisible();
  });
  test('conversation history title editing', async ({ page }) => {
    const chat = new Chat(page);
    await chat.goto();

    const updatedTitle = 'Updated Title';

    await chat.submitMessage(
      'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
    );

    await chat.waitForStreamToFinish();

    const initialHistoryTitle = await page
      .getByTestId('chat-history-entry')
      .first()
      .textContent();

    expect(initialHistoryTitle).not.toBe('');
    expect(initialHistoryTitle).toBe('New Chat');
    await page.waitForFunction(() => {
      const historyEntry = document.querySelector(
        '[data-testid="chat-history-entry"]:first-child',
      );
      const title = historyEntry?.textContent;
      return title && title !== 'New Chat';
    });

    const summarizedHistoryTitle = await page
      .getByTestId('chat-history-entry')
      .first()
      .textContent();

    const chatOptionButton = page.getByLabel('Chat Options').first();
    await chatOptionButton.click();

    const renameButton = page.getByRole('button', { name: 'Rename Title' });
    await renameButton.click();

    const titleInput = page.locator('input[role="Edit Title Input"]');
    await titleInput.fill(updatedTitle);

    // Verify the title hasn't changed after clicking cancel
    const cancelButton = page.getByRole('button', {
      name: 'Cancel Rename Title',
    });
    await cancelButton.click();

    const titleAfterCancel = await page
      .getByTestId('chat-history-entry')
      .first()
      .textContent();

    expect(titleAfterCancel).toBe(summarizedHistoryTitle);
    expect(titleAfterCancel).not.toBe(updatedTitle);

    await renameButton.click();
    await titleInput.fill(updatedTitle);

    //  todo - adjust after #372 when pressing enter to confirm the new title
    //  also closes the editing view
    await page.keyboard.press('Enter');
    await chatOptionButton.click();

    const updatedHistoryTitle = await page
      .getByTestId('chat-history-entry')
      .first()
      .textContent();

    expect(updatedHistoryTitle).toBe(updatedTitle);
    expect(updatedHistoryTitle).not.toBe(initialHistoryTitle);

    // Updated title persists after reload
    await page.reload();

    const historyTitleAfterReload = await page
      .getByTestId('chat-history-entry')
      .first()
      .textContent();

    expect(historyTitleAfterReload).toBe(updatedTitle);
    expect(historyTitleAfterReload).not.toBe(initialHistoryTitle);
  });

  // skipping: uses deprecated local storage
  test.skip('conversation search functionality', async ({ page }) => {
    const chat = new Chat(page);

    await page.addInitScript(() => {
      const systemPrompt = {
        role: 'system',
        content:
          'You are an AI assistant knowledgeable about blockchain technologies.',
      };

      localStorage.setItem(
        'conversations',
        JSON.stringify({
          'test-id-1': {
            id: 'test-id-1',
            model: 'test-model',
            title: 'Blockchain Discussion',
            conversation: [
              systemPrompt,
              {
                role: 'user',
                content:
                  'Tell me about blockchain technology and its applications',
              },
              {
                role: 'assistant',
                content:
                  'Blockchain is a decentralized digital ledger technology.',
              },
            ],
            lastSaved: Date.now(),
          },
          'test-id-2': {
            id: 'test-id-2',
            model: 'test-model',
            title: 'Machine Learning Chat',
            conversation: [
              systemPrompt,
              {
                role: 'user',
                content: 'Explain machine learning algorithms',
              },
              {
                role: 'assistant',
                content:
                  'Machine learning involves training models to make predictions.',
              },
            ],
            lastSaved: Date.now() - 1000,
          },
          'test-id-3': {
            id: 'test-id-3',
            model: 'test-model',
            title: 'API Integration Help',
            conversation: [
              systemPrompt,
              {
                role: 'user',
                content: 'How to integrate RESTful APIs effectively',
              },
              {
                role: 'assistant',
                content:
                  'API integration involves connecting different software systems.',
              },
            ],
            lastSaved: Date.now() - 2000,
          },
          'test-id-4': {
            id: 'test-id-4',
            model: 'test-model',
            title: 'Complex Search Scenario',
            conversation: [
              systemPrompt,
              {
                role: 'user',
                content: 'Initial question about general topics',
              },
              {
                role: 'assistant',
                content: 'Search functionality can be complex and nuanced.',
              },
              {
                role: 'user',
                content:
                  'Now I want to discuss advanced search functionality in depth',
              },
            ],
            lastSaved: Date.now() - 3000,
          },
        }),
      );
    });

    await chat.goto();

    const searchButton = page.getByRole('button', { name: 'Search History' });
    await searchButton.click();

    const modalEntries = page.getByTestId('search-chat-history-entry');
    await expect(modalEntries).toHaveCount(4);

    // Test searching by title
    const searchInput = page.getByPlaceholder('Search conversations...');
    await searchInput.fill('Blo');

    let filteredEntries = page.getByTestId('search-chat-history-entry');
    await expect(filteredEntries).toHaveCount(1);

    const filteredTitle = filteredEntries
      .first()
      .getByTestId('search-history-title');
    await expect(filteredTitle).toHaveText('Blockchain Discussion');

    await searchInput.clear();

    // Test searching by conversation content
    await searchInput.fill('decentralized');
    filteredEntries = page.getByTestId('search-chat-history-entry');
    await expect(filteredEntries).toHaveCount(1);

    const contentTitle = filteredEntries
      .first()
      .getByTestId('search-history-title');
    await expect(contentTitle).toHaveText('Blockchain Discussion');

    const contentSnippet = filteredEntries
      .first()
      .getByTestId('search-history-content');
    await expect(contentSnippet).toContainText(
      'decentralized digital ledger technology.',
    );

    // Test title & snippet match behavior
    await searchInput.clear();
    await searchInput.fill('Complex');

    filteredEntries = page.getByTestId('search-chat-history-entry');
    await expect(filteredEntries).toHaveCount(1);

    const titleMatchTitle = filteredEntries
      .first()
      .getByTestId('search-history-title');
    await expect(titleMatchTitle).toHaveText('Complex Search Scenario');

    const titleMatchSnippet = filteredEntries
      .first()
      .getByTestId('search-history-content');
    await expect(titleMatchSnippet).toContainText('complex and nuanced');

    // Test content match in second user message
    await searchInput.clear();
    await searchInput.fill('advanced');
    filteredEntries = page.getByTestId('search-chat-history-entry');
    await expect(filteredEntries).toHaveCount(1);

    const contentMatchTitle = filteredEntries
      .first()
      .getByTestId('search-history-title');
    await expect(contentMatchTitle).toHaveText('Complex Search Scenario');

    const contentMatchSnippet = filteredEntries
      .first()
      .getByTestId('search-history-content');
    await expect(contentMatchSnippet).toContainText(
      'advanced search functionality in depth',
    );

    // Clear the search & verify all conversations are visible again
    await searchInput.clear();
    await expect(page.getByTestId('search-chat-history-entry')).toHaveCount(4);

    //  Test no results
    await searchInput.clear();
    await searchInput.fill('asdfffewf');

    const noResults = page.getByText('No results');
    await expect(noResults).toBeVisible();

    //  Close with icon
    const closeIcon = page.getByRole('button', { name: 'Close search modal' });
    await closeIcon.click();
    await expect(searchInput).not.toBeVisible();

    // Reopen modal & test closing by clicking outside
    await searchButton.click();

    await page.mouse.click(0, 0);
    await expect(searchInput).not.toBeVisible();
  });

  // skipping: uses deprecated local storage
  test.skip('search modal button is disabled for a user with no history', async ({
    page,
  }) => {
    const chat = new Chat(page);

    await chat.goto();

    //  explicitly removing any conversations from local storage, simulating a new user
    //  or if a user clears their browser cache
    await page.addInitScript(() => {
      localStorage.removeItem('conversations');
    });

    const searchButton = page.getByRole('button', { name: 'Search History' });
    await expect(searchButton).toBeDisabled();

    await expect(page.getByText('Start a new chat to begin')).toBeVisible();
  });
  test('allows a user to upload a file up to 8MB limit', async ({ page }) => {
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const paperclipButton = page.getByRole('button', {
      name: 'Attach file icon',
    });

    const imagePath = join(process.cwd(), 'e2e/images/orosLogo.png');

    const buffer = fs.readFileSync(imagePath);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await paperclipButton.click();
    const fileChooser = await fileChooserPromise;

    const fileWithinLimit = {
      name: 'orosLogo.png',
      mimeType: 'image/png',
      buffer,
    };

    await fileChooser.setFiles([fileWithinLimit]);

    const imagePreviewContainer = page.locator('.imagePreviewContainer');
    if (await imagePreviewContainer.isVisible()) {
      const imageCards = page.locator('.imageCard');
      const count = await imageCards.count();
      expect(count).toEqual(1);
    }

    await chat.submitMessage('Describe this image');

    const uploadedImage = page.getByRole('img', {
      name: 'File upload chat message',
    });

    await expect(uploadedImage).toBeVisible();
  });
  test('allows user to upload multiple files', async ({ page }) => {
    const maxFileUploads = 4;
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const paperclipButton = page.getByRole('button', {
      name: 'Attach file icon',
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await paperclipButton.click();
    const fileChooser = await fileChooserPromise;

    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    const withinLimitSupportedFiles = [...Array(maxFileUploads)].map(() => ({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer,
    }));

    await fileChooser.setFiles(withinLimitSupportedFiles);

    const imagePreviewContainer = page.locator('.imagePreviewContainer');
    if (await imagePreviewContainer.isVisible()) {
      const imageCards = page.locator('.imageCard');
      const count = await imageCards.count();
      expect(count).toEqual(4);
    }

    await chat.submitMessage('Here are multiple images');

    const uploadedImage = page.getByRole('img', {
      name: 'File upload chat message',
    });
    const paginationDisplay = page.getByText('1 / 4');

    await expect(uploadedImage).toBeVisible();
    await expect(paginationDisplay).toBeVisible();
  });
  test('shows error when trying to upload too many files', async ({ page }) => {
    const maxFileUploads = 4;
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const paperclipButton = page.getByRole('button', {
      name: 'Attach file icon',
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await paperclipButton.click();
    const fileChooser = await fileChooserPromise;

    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    const overLimitSupportedFiles = [...Array(maxFileUploads + 1)].map(() => ({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer,
    }));

    await fileChooser.setFiles(overLimitSupportedFiles);

    const errorMessage = page.getByText('Maximum 4 files allowed');
    await expect(errorMessage).toBeVisible();

    //  Verify the error message clears
    await page.waitForTimeout(2500);
    await expect(errorMessage).not.toBeVisible();
  });
  test('shows error when trying to upload a file larger than 8MB', async ({
    page,
  }) => {
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const paperclipButton = page.getByRole('button', {
      name: 'Attach file icon',
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await paperclipButton.click();
    const fileChooser = await fileChooserPromise;

    //  9MB
    const largeBuffer = Buffer.alloc(9 * 1024 * 1024 + 1024, 'x');

    const oversizedFile = {
      name: 'oversized-image.png',
      mimeType: 'image/png',
      buffer: largeBuffer,
    };

    await fileChooser.setFiles([oversizedFile]);

    const errorMessage = page.getByText(
      'File too large! Maximum file size is 8MB.',
    );
    await expect(errorMessage).toBeVisible();

    await page.waitForTimeout(2500);
    await expect(errorMessage).not.toBeVisible();
  });

  test('uploading multiple files handled independently', async ({ page }) => {
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const paperclipButton = page.getByRole('button', {
      name: 'Attach file icon',
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await paperclipButton.click();
    const fileChooser = await fileChooserPromise;

    //  9MB
    const largeBuffer = Buffer.alloc(9 * 1024 * 1024 + 1024, 'x');

    const oversizedFile = {
      name: 'oversized-image.png',
      mimeType: 'image/png',
      buffer: largeBuffer,
    };

    //  7MB
    const bufferWithinLimit = Buffer.alloc(7 * 1024 * 1024 + 1024, 'x');

    const fileWithinLimit = {
      name: 'withinLimit-image.png',
      mimeType: 'image/png',
      buffer: bufferWithinLimit,
    };

    await fileChooser.setFiles([oversizedFile, fileWithinLimit]);

    //  Verify that the 7MB file was uploaded
    const imagePreviewContainer = page.locator('.imagePreviewContainer');
    if (await imagePreviewContainer.isVisible()) {
      const imageCards = page.locator('.imageCard');
      const count = await imageCards.count();
      expect(count).toEqual(1);
    }
  });

  //  todo - reintroduce when multiple models become supported
  test.skip('image previews are cleared on model switch', async ({ page }) => {
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const paperclipButton = page.getByRole('button', {
      name: 'Attach file icon',
    });

    const imagePath = join(process.cwd(), 'e2e/images/orosLogo.png');

    const buffer = fs.readFileSync(imagePath);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await paperclipButton.click();
    const fileChooser = await fileChooserPromise;

    const fileWithinLimit = {
      name: 'orosLogo.png',
      mimeType: 'image/png',
      buffer,
    };

    await fileChooser.setFiles([fileWithinLimit]);

    const imagePreviewContainer = page.locator('.imagePreviewContainer');

    if (await imagePreviewContainer.isVisible()) {
      const imageCards = page.locator('.imageCard');
      const count = await imageCards.count();
      expect(count).toEqual(1);
    }

    expect(await imagePreviewContainer.isVisible()).toBe(false);
  });
  test('image previews are cleared on new chat click', async ({ page }) => {
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const paperclipButton = page.getByRole('button', {
      name: 'Attach file icon',
    });

    const imagePath = join(process.cwd(), 'e2e/images/orosLogo.png');

    const buffer = fs.readFileSync(imagePath);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await paperclipButton.click();
    const fileChooser = await fileChooserPromise;

    const fileWithinLimit = {
      name: 'orosLogo.png',
      mimeType: 'image/png',
      buffer,
    };

    await fileChooser.setFiles([fileWithinLimit]);

    const imagePreviewContainer = page.locator('.imagePreviewContainer');

    if (await imagePreviewContainer.isVisible()) {
      const imageCards = page.locator('.imageCard');
      const count = await imageCards.count();
      expect(count).toEqual(1);
    }

    const newChatIcon = page.getByRole('button', { name: 'New Chat' });
    await newChatIcon.click();

    expect(await imagePreviewContainer.isVisible()).toBe(false);
  });

  // skipping: uses deprecated local storage
  test.skip('image previews are cleared when visiting old chat (even if model supports it)', async ({
    page,
  }) => {
    test.setTimeout(30 * 1000);

    await page.addInitScript(() => {
      localStorage.setItem(
        'conversations',
        JSON.stringify({
          'test-id': {
            id: 'test-id',
            model: 'gpt-4o',
            title: 'Test Conversation Title',
            conversation: [
              {
                role: 'user',
                content: 'test message',
              },
            ],
            lastSaved: Date.now(),
          },
        }),
      );
    });

    const chat = new Chat(page);
    await chat.goto();

    const paperclipButton = page.getByRole('button', {
      name: 'Attach file icon',
    });

    const imagePath = join(process.cwd(), 'e2e/images/orosLogo.png');

    const buffer = fs.readFileSync(imagePath);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await paperclipButton.click();
    const fileChooser = await fileChooserPromise;

    const fileWithinLimit = {
      name: 'orosLogo.png',
      mimeType: 'image/png',
      buffer,
    };

    await fileChooser.setFiles([fileWithinLimit]);

    const imagePreviewContainer = page.locator('.imagePreviewContainer');

    if (await imagePreviewContainer.isVisible()) {
      const imageCards = page.locator('.imageCard');
      const count = await imageCards.count();
      expect(count).toEqual(1);
    }

    const historyEntry = page.getByTestId('chat-history-entry').first();
    await historyEntry.click();

    expect(await imagePreviewContainer.isVisible()).toBe(false);
  });

  test('allows a user to upload a supported file via drag & drop', async ({
    page,
  }) => {
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    await page.evaluate(async () => {
      const dataTransfer = new DataTransfer();

      const file = new File([''], 'testImage.png', { type: 'image/png' });
      dataTransfer.items.add(file);

      //  A user can drop the document anywhere on the page
      const dropTarget = document;

      dropTarget.dispatchEvent(
        new DragEvent('dragover', {
          dataTransfer,
        }),
      );

      dropTarget.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer,
        }),
      );
    });

    const imagePreviewContainer = page.locator('.imagePreviewContainer');

    if (await imagePreviewContainer.isVisible()) {
      const imageCards = page.locator('.imageCard');
      const count = await imageCards.count();
      expect(count).toEqual(1);
    }

    await chat.submitMessage('Describe this image');

    const uploadedImage = page.getByRole('img', {
      name: 'File upload chat message',
    });

    await expect(uploadedImage).toBeVisible({ timeout: 15000 });
  });

  test('can paste image from clipboard', async ({ page }) => {
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    await page.evaluate(async () => {
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: new DataTransfer(),
      });

      //  7MB
      const supportedDataArray = new Uint8Array(7 * 1024 * 1024);

      const blob = new Blob([supportedDataArray], { type: 'image/png' });
      const file = new File([blob], 'large-image.png', { type: 'image/png' });

      //  Add the file to the clipboard data
      Object.defineProperty(pasteEvent.clipboardData, 'items', {
        value: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
      });

      document.activeElement.dispatchEvent(pasteEvent);
    });

    const imagePreviewContainer = page.locator('.imagePreviewContainer');

    if (await imagePreviewContainer.isVisible()) {
      const imageCards = page.locator('.imageCard');
      const count = await imageCards.count();
      expect(count).toEqual(1);
    }

    await chat.submitMessage('Describe this image');

    const uploadedImage = page.getByRole('img', {
      name: 'File upload chat message',
    });

    await expect(uploadedImage).toBeVisible({ timeout: 15000 });
  });

  test('shows error when pasting an image larger than 8MB from clipboard', async ({
    page,
  }) => {
    test.setTimeout(30 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    await page.evaluate(async () => {
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: new DataTransfer(),
      });

      //  9MB
      const largeDataArray = new Uint8Array(9 * 1024 * 1024);

      const blob = new Blob([largeDataArray], { type: 'image/png' });
      const file = new File([blob], 'large-image.png', { type: 'image/png' });

      Object.defineProperty(pasteEvent.clipboardData, 'items', {
        value: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
      });

      document.activeElement.dispatchEvent(pasteEvent);
    });

    const errorMessage = page.getByText(
      'File too large! Maximum file size is 8MB.',
    );
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(2500);
    await expect(errorMessage).not.toBeVisible();

    const imagePreviewContainer = page.locator('.imagePreviewContainer');
    await expect(imagePreviewContainer).not.toBeVisible();
  });
});
