import {
  BrowserContext,
  ElementHandle,
  expect,
  Locator,
  Page,
} from '@playwright/test';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { Wallet } from './Wallet';

export class Chat {
  public page: Page;
  public messageContainer: Locator;

  constructor(page: Page, ctx: BrowserContext, wallet?: Wallet) {
    this.page = page;
    this.messageContainer = this.page.locator(
      `[data-testid="conversation"] div div`,
    );
  }

  private async getAllMessageElements(): Promise<ElementHandle<Node>[]> {
    return await this.page.$$('[data-testid="conversation-message"]');
  }

  /**
   * Blank locators can be added to the chat container during the loading text animation
   * This function removes those and only leaves elements that have text content
   * This is useful because the response should be the last element after cleanup
   */
  private async removeEmptyMessageElements(
    messageElements: ElementHandle<Node>[],
  ) {
    const trimmedMessages: ElementHandle<Node>[] = [];
    for (const element of messageElements) {
      const textContent = await element.textContent();
      if (textContent && textContent.trim() !== '') {
        trimmedMessages.push(element);
      }
    }
    return trimmedMessages;
  }

  async getMessageElementsWithContent() {
    const messageElements = await this.getAllMessageElements();
    return await this.removeEmptyMessageElements(messageElements);
  }

  async goto() {
    await this.page.goto('http://localhost:4000');
    await this.page.waitForLoadState();
  }

  async submitMessage(text: string) {
    await this.page.getByTestId('chat-view-input').fill(text);
    await this.page.getByTestId('chat-view-button').click();
  }

  async waitForStreamToFinish() {
    await this.page.waitForResponse(async (res) => {
      if (res.url().includes('completions')) {
        expect(res.status()).toBe(200);
        await res.finished(); // it's important to wait for the stream to finish
        return true;
      }
      return false;
    });
  }

  async waitForImageGenerationToFinish() {
    await this.page.waitForResponse(
      async (res) => {
        if (res.url().includes('generations')) {
          expect(res.status()).toBe(200);
          await res.finished();
          return true;
        }
        return false;
      },
      {
        timeout: 40000,
      },
    );
  }

  async waitForAssistantResponse() {
    await this.page.waitForFunction(
      () => {
        const messages = document.querySelectorAll(
          '[data-testid="conversation-message"]',
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
