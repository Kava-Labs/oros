import { ElementHandle, expect, Locator, Page } from '@playwright/test';

export class Chat {
  public page: Page;
  public messageContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageContainer = this.page.locator(
      `[data-testid="conversation"] div div`,
    );

    // Log any failed requests
    this.page.on('requestfailed', (request) => {
      const failure = request.failure();
      if (failure) {
        console.log(request.url() + ' ' + failure.errorText);
      }
    });

    // Log any 4xx or 5xx responses
    this.page.on('requestfinished', async (request) => {
      const resp = await request.response();

      if (resp && resp.status() >= 400) {
        const bodyBuffer = resp.body();
        const bodyStr = bodyBuffer.toString();
        console.log(request.url() + ' ' + resp.status() + ' ' + bodyStr);
      }
    });
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

  async switchToBlockchainModel() {
    await this.page.getByRole('combobox', { name: 'Select Model' }).click();
    await this.page
      .getByRole('option', { name: 'Blockchain Instruct' })
      .click();
  }
}
