import { expect, test } from '@playwright/test';
import { Chat } from './Chat';
import * as fs from 'fs';
import { join } from 'path';

const { describe } = test;

test.beforeEach(async ({ page }) => {
  // This guarantees /session won't cause ERR_CONNECTION_REFUSED
  await page.route('**/session**', (route) => {
    route.fulfill({ status: 204, body: '' });
  });
});

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
