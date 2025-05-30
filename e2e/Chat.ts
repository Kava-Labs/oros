import { ElementHandle, Locator, Page } from '@playwright/test';

export class Chat {
  public page: Page;
  public messageContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Mock the /session endpoint for both GET and POST
    this.page.route('**/session', async (route, _request) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

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

  private getAllMessageLocator(): Locator {
    return this.page.locator('[data-testid="conversation-message"]');
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

  private filterNonEmptyMessages(messageLocator: Locator): Locator {
    return messageLocator.filter({ hasText: /\S/ });
  }

  async getMessageElementsWithContent(): Promise<Locator> {
    const messageLocator = this.getAllMessageLocator();
    return this.filterNonEmptyMessages(messageLocator);
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
        const request = res.request();
        const requestBody = JSON.parse(request.postData() || '{}');
        if (requestBody.model === 'o3-mini') {
          await res.finished();
          return true;
        }
      }
      return false;
    });
  }

  async waitForSummarizationToFinish() {
    await this.page.waitForResponse(async (res) => {
      if (res.url().includes('completions')) {
        const request = res.request();
        const requestBody = JSON.parse(request.postData() || '{}');

        //  we send the summarization to the leaner model
        if (requestBody.model === 'gpt-4o-mini') {
          await res.finished();
          return true;
        }
      }
      return false;
    });
  }
}
