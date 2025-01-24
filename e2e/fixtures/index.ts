import { test as base, chromium, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// @ts-ignore
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
export const beforeEach = test.beforeEach;
export const describe = test.describe;
export const only = test.only;
// export const use = test.use;
export const expect = test.expect;
