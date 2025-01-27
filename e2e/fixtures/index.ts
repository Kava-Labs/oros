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

export { screenshotOnFailure, getWalletId } from './utils';
export const describe = test.describe;
export const only = test.only;
export const expect = test.expect;

const DEFAULT_INTERVAL = 1000; // 1 second

export async function retryClick(
  page: Page | Frame,
  buttonOptions: { role: string; name: string },
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const MAX_RETRIES = 5;
  const interval = options.interval || DEFAULT_INTERVAL;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const button = await page.getByRole('button', buttonOptions);
      await button.click({ timeout: interval });
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(
          `Failed to click button "${buttonOptions.name}" after ${MAX_RETRIES} attempts: ${error.message}`,
        );
      }
      await page.waitForTimeout(interval);
    }
  }
}

export async function confirmMetamaskConnection(
  metamaskPopup: Page | Frame,
  { timeout = 60000, interval = 500 } = {},
): Promise<void> {
  await retryClick(
    metamaskPopup,
    { role: 'button', name: 'Connect' },
    { timeout, interval },
  );
}

export async function confirmMetamaskTransaction(
  metamaskPopup: Page | Frame,
  { timeout = 60000, interval = 500 } = {},
): Promise<void> {
  await confirmMetamaskConnection(metamaskPopup, { timeout, interval });

  await retryClick(
    metamaskPopup,
    { role: 'button', name: 'Confirm' },
    { timeout, interval },
  );
}
