import {
  test as base,
  chromium,
  BrowserContext,
  Page,
  Frame,
} from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// @ts-expect-error - Cannot find name 'dirname'/'fileURLToPath'
const __dirname = dirname(fileURLToPath(import.meta.url));

async function scanPages(
  ctx: BrowserContext,
  match: (title: string) => boolean,
  retry = 60,
  backoff = 500,
): Promise<Page | null> {
  do {
    for (const page of ctx.pages()) if (match(await page.title())) return page;
    for (const page of ctx.backgroundPages())
      if (match(await page.title())) return page;
    await new Promise((resolve) => setTimeout(() => resolve(true), backoff));
  } while (retry-- > 0);
  return null;
}

export const test = base.extend<{
  context: BrowserContext;
  metaMaskExtensionId: string;
}>({
  // because playwright needs this to operate
  // eslint-disable-next-line
  context: async ({}, testUse) => {
    const metaMaskExtensionPath = path.join(
      __dirname,
      '..',
      'metamask-chrome-12.9.3',
    );

    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${metaMaskExtensionPath}`,
        `--load-extension=${metaMaskExtensionPath}`,
      ],
      bypassCSP: true,
    });

    await testUse(context);
    await context.close();
  },

  metaMaskExtensionId: async ({ context }, testUse) => {
    const match = (title: string) => {
      return title === 'MetaMask';
    };

    const page = await scanPages(context, match);
    if (page) {
      const extensionID = page.url().split('/')[2];
      await testUse(extensionID);
    } else {
      throw new Error('Metamask Extension was not found');
    }
  },
});

export { screenshotOnFailure } from './utils';
export const describe = test.describe;
export const only = test.only;
export const expect = test.expect;

type ButtonLocator = { name: string } | { 'data-testid': string };

/**
 * Retries clicking a button that may be flaky in tests
 * @param page - Playwright Page or Frame
 * @param locator - Either a name or test ID to find the button
 */
export async function retryButtonClick(
  page: Page | Frame,
  locator: ButtonLocator,
): Promise<void> {
  const MAX_RETRIES = 5;
  const DEFAULT_INTERVAL = 1000;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const button =
        'data-testid' in locator
          ? page.getByTestId(locator['data-testid'])
          : page.getByRole('button', locator);

      await button.click({ timeout: DEFAULT_INTERVAL });
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) {
        const identifier =
          'data-testid' in locator ? locator['data-testid'] : locator.name;
        throw new Error(
          `Failed to click button "${identifier}" after ${MAX_RETRIES} attempts: ${error.message}`,
        );
      }
      await page.waitForTimeout(DEFAULT_INTERVAL);
    }
  }
}
