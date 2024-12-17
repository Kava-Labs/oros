import { expect, Locator, Page } from '@playwright/test';
import type { ChatCompletionMessageParam } from 'openai/resources/index';

export class Chat {
  public page: Page;
  public messageContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageContainer = this.page.locator(
      `[data-testid="conversation"] div div`,
    );
  }

  async getMessageElements() {
    return await this.page.$$('[data-testid="conversation-message"]');
  }

  async goto() {
    await this.page.goto('http://localhost:3000');
    await this.page.waitForLoadState();
  }

  async submitMessage(text: string) {
    await this.page.getByTestId('chat-view-input').fill(text);
    await this.page.getByTestId('chat-view-button').click();
  }

  async waitForStreamToFinish() {
    await this.page.waitForResponse(async (res) => {
      if (res.url().includes('chat')) {
        expect(res.status()).toBe(200);
        await res.finished(); // it's important to wait for the stream to finish
        return true;
      }
      return false;
    });
  }

  async waitForAssistantResponse() {
    await this.page.waitForFunction(
      () => {
        const messages = document.querySelectorAll(
          '[data-testid="conversation"] div div',
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
  }

  async setMessagesInStorage(msgs: ChatCompletionMessageParam[]) {
    await this.page.evaluate((messages) => {
      localStorage.setItem(
        'chat-messages',
        JSON.stringify({
          messages,
        }),
      );
    }, msgs); //  this second arg defines what is passed to pageFunction, the first arg
  }

  async getMessageHistoryFromStorage() {
    return await this.page.evaluate(() =>
      localStorage.getItem('chat-messages'),
    );
  }
}
