import { test as base, chromium, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// @ts-expect-error - Cannot find name 'dirname'/'fileURLToPath'
const __dirname = dirname(fileURLToPath(import.meta.url));

async function getBackgroundPage(
  ctx: BrowserContext,
  match: (title: string) => boolean,
  timeout = 5000,
): Promise<Page | null> {
  try {
    const backgroundPages = ctx.backgroundPages();
    if (!backgroundPages.length) {
      await ctx.waitForEvent('backgroundpage', {
        timeout,
      });
    }

    const page = await scanPages(ctx, match);
    if (page) return page;
  } catch (err) {
    console.error(err);
  }

  try {
    await ctx.waitForEvent('page', { timeout });

    const page = await scanPages(ctx, match);
    if (page) return page;
  } catch (err) {
    console.error(err);
  }

  return null;
}

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
    const max = 3;
    let retry = 0;

    while (++retry <= max) {
      const metaMaskPage = await getBackgroundPage(context, (title) => {
        return title === 'MetaMask';
      });
      if (metaMaskPage) {
        const metaMaskExtensionId = metaMaskPage.url().split('/')[2];
        await testUse(metaMaskExtensionId);
        return;
      } else {
        if (retry === max) {
          throw new Error('MetaMask Extension was not found');
        }
      }
    }
  },
});

export { screenshotOnFailure, getWalletId } from './utils';
export const beforeEach = test.beforeEach;
export const describe = test.describe;
export const only = test.only;
export const expect = test.expect;
