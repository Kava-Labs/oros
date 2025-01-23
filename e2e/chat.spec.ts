import { describe, test, expect } from './fixtures';
import { Chat } from './Chat';
import { MetaMask } from './Metamask';
import { beforeEach, getWalletId } from './fixtures';
import { EvmWalletID } from './Wallet';

describe('chat', () => {
  let metaMask: MetaMask;
  // register metamask account to get app ready for testing
  beforeEach(async ({ metaMaskExtensionId, context }, testInfo) => {
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
  test('send tx', async ({ page, context }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page, context, metaMask);
    await chat.goto();

    await chat.submitMessage(
      'Send 0.1 KAVA to 0xd8e30F7BCB5211E591BBc463cDAb0144e82dFfE5',
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
});
