import { describe, expect } from './fixtures';
import { Chat } from './Chat';
//  todo - eventually import test from fixtures when integrated with metamask in CI/CD
import test from '@playwright/test';

describe('chat', () => {
  test('renders intro message', async ({ page }) => {
    const chat = new Chat(page);
    await chat.goto();

    expect(chat.messageContainer).not.toBeNull();

    await expect(page.getByText("let's get started").first()).toBeVisible();

    await expect(
      page.getByText(
        "Welcome to Oros! I'm here to help you with all things blockchain and DeFi. Whether you're checking your balances, managing transactions, or exploring earning opportunities, I'll guide you every step of the way. Let's get started. What can I assist you with today?",
      ),
    ).toBeVisible();
  });

  test('receiving a response from the model', async ({ page }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    await chat.submitMessage(
      'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
    );

    await chat.waitForStreamToFinish();
    await chat.waitForAssistantResponse();

    const messages = await chat.getMessageElementsWithContent();
    expect(messages.length).toBeGreaterThan(0);

    const attr =
      await messages[messages.length - 1].getAttribute('data-chat-role');
    expect(attr).toBe('assistant');

    const responseText = await messages[messages.length - 1].innerText();
    expect(responseText).toMatch(/THIS IS A TEST/i);
  });

  //  todo - integrate with CI/CD
  // describe('wallet tests', () => {
  //   let metaMask: MetaMask;
  //
  //   beforeEach(async ({ context, metaMaskExtensionId }, testInfo) => {
  //     expect(metaMaskExtensionId).toBeDefined();
  //
  //     const walletId = getWalletId(
  //       [EvmWalletID.CHAT_TESTING_ACCOUNT_A],
  //       testInfo.retry,
  //     );
  //
  //     metaMask = await MetaMask.prepareWallet(
  //       context,
  //       metaMaskExtensionId,
  //       walletId,
  //       true,
  //     );
  //   });
  //
  //   test('check balances', async ({ page, context }) => {
  //     test.setTimeout(90 * 1000);
  //
  //     const chat = new Chat(page);
  //     await chat.goto();
  //
  //     await metaMask.switchNetwork();
  //
  //     //  be ready to find the upcoming popup
  //     const metamaskPopupPromise = context.waitForEvent('page');
  //     await chat.submitMessage('What are my balances');
  //
  //     await chat.waitForStreamToFinish();
  //
  //     const metamaskPopup = await metamaskPopupPromise;
  //     await metamaskPopup.waitForLoadState();
  //     await metamaskPopup.getByTestId('confirm-btn').click();
  //
  //     await chat.waitForStreamToFinish();
  //     await chat.waitForAssistantResponse();
  //
  //     const messages = await chat.getMessageElementsWithContent();
  //     const responseText = await messages[messages.length - 1].innerText();
  //
  //     //  Verify that the connected wallet has some KAVA balance
  //     const kavaMatch = responseText.match(/KAVA: ([\d.]+)/);
  //     expect(kavaMatch).toBeTruthy();
  //     const kavaBalance = Number(kavaMatch[1]);
  //     expect(kavaBalance).toBeGreaterThan(0);
  //   });
  //
  //   test('send tx', async ({ page, context }) => {
  //     test.setTimeout(90 * 1000);
  //
  //     const chat = new Chat(page);
  //     await chat.goto();
  //
  //     await metaMask.switchNetwork();
  //
  //     //  be ready to find the upcoming popup
  //     const metamaskPopupPromise = context.waitForEvent('page');
  //
  //     await chat.submitMessage(
  //       'Send 0.0000001 KAVA to 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D',
  //     );
  //
  //     await chat.waitForStreamToFinish();
  //
  //     //  Confirm the tx
  //     await chat.submitMessage('Yes');
  //
  //     //  In progress
  //     await expect(page.getByTestId('in-progress-tx-display')).toBeVisible();
  //
  //     const metamaskPopup = await metamaskPopupPromise;
  //     await metamaskPopup.getByRole('button', { name: 'Connect' }).click();
  //     await metamaskPopup.getByRole('button', { name: 'Confirm' }).click();
  //
  //     //  Completed
  //     await expect(page.getByTestId('complete-tx-display')).toBeVisible();
  //   });
  // });
});
