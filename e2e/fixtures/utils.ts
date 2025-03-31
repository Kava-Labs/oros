import type { TestInfo, Page } from '@playwright/test';

export async function screenshotOnFailure(
  { page }: { page: Page },
  testInfo: TestInfo,
) {
  if (testInfo.status !== testInfo.expectedStatus) {
    const path = testInfo.outputPath(testInfo.title + '-failure.png');

    testInfo.attachments.push({
      path,
      contentType: 'image/png',
      name: 'screenshot',
    });

    await page.screenshot({ path, timeout: 5000 });
  }
}
