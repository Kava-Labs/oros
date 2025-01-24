import { describe, expect, beforeEach, getWalletId, test } from './fixtures';
import { Chat } from './Chat';
import { MetaMask } from './Metamask';
import { EvmWalletID } from './Wallet';

describe('chat', () => {
  let metaMask: MetaMask;
  // register metamask account to get app ready for testing
  beforeEach(async ({ context, metaMaskExtensionId }, testInfo) => {
    expect(metaMaskExtensionId).toBeDefined();

    const walletId = getWalletId(
      [EvmWalletID.CHAT_TESTING_ACCOUNT_A],
      testInfo.retry,
    );

    metaMask = await MetaMask.prepareWallet(
      context,
      metaMaskExtensionId,
      walletId,
      true,
    );
  });
  test('renders intro message', async ({ page, context }) => {
    const chat = new Chat(page, context);
    await chat.goto();

    expect(chat.messageContainer).not.toBeNull();

    await expect(page.getByText("let's get started")).toBeVisible();

    await expect(
      page.getByText(
        "Tell me about your memecoin idea below and we'll generate everything you need to get it launched.",
      ),
    ).toBeVisible();
  });

  test('receiving a response from the model', async ({ page, context }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page, context);
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

  test('check balances', async ({ page, context }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page, context, metaMask);
    await chat.goto();
    await metaMask.switchNetwork();

    //  be ready to find the upcoming popup
    const metamaskPopupPromise = context.waitForEvent('page');
    await chat.submitMessage('What are my balances?');

    await chat.waitForStreamToFinish();

    let messages = await chat.getMessageElementsWithContent();
    expect(messages.length).toBeGreaterThan(0);

    const metamaskPopup = await metamaskPopupPromise;
    await metamaskPopup.waitForLoadState();
    await metamaskPopup.getByTestId('confirm-btn').click();

    await chat.waitForStreamToFinish();
    await chat.waitForAssistantResponse();

    messages = await chat.getMessageElementsWithContent();
    const responseText = await messages[messages.length - 1].innerText();
    expect(responseText).toContain('current balance');
    expect(responseText).toContain('KAVA: ');
  });
});
