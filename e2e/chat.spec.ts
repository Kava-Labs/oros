import {
  describe,
  expect,
  test,
  confirmMetamaskTransaction,
  confirmMetamaskConnection,
} from './fixtures';
import { Chat } from './Chat';
import { MetaMask } from './Metamask';
import { ethers } from 'ethers';

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

  test('check balances', async ({ page, context, metaMaskExtensionId }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const metaMask = await MetaMask.prepareWallet(context, metaMaskExtensionId);

    await metaMask.switchNetwork();

    //  be ready to find the upcoming popup
    const metamaskPopupPromise = context.waitForEvent('page');

    await chat.submitMessage('What are my balances on Kava Internal Testnet?');

    await chat.waitForStreamToFinish();

    const metamaskPopup = await metamaskPopupPromise;
    await confirmMetamaskConnection(metamaskPopup);

    await chat.waitForStreamToFinish();
    await chat.waitForAssistantResponse();

    const messages = await chat.getMessageElementsWithContent();
    const responseText = await messages[messages.length - 1].innerText();

    //  Verify that the connected wallet has a balance of >1000 TKAVA
    const kavaMatch = responseText.match(/TKAVA: ([^\n]+)/);
    expect(kavaMatch).toBeTruthy();
    const kavaBalance = Number(kavaMatch[1].replace(/,/g, ''));
    expect(kavaBalance).toBeGreaterThan(1000);
  });

  test('send tx (native asset)', async ({
    page,
    context,
    metaMaskExtensionId,
  }) => {
    const KAVA_EVM_DECIMALS = 10 ** 18;
    test.setTimeout(90 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const metaMask = await MetaMask.prepareWallet(context, metaMaskExtensionId);

    await metaMask.switchNetwork();

    //  be ready to find the upcoming popup
    const metamaskPopupPromise = context.waitForEvent('page');

    await chat.submitMessage(
      'Send 0.12345 TKAVA to 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D on Kava EVM Internal Testnet',
    );

    await chat.waitForStreamToFinish();

    //  Confirm the tx
    await chat.submitMessage('Yes');

    //  In progress
    await expect(page.getByTestId('in-progress-tx-display')).toBeVisible();

    const metamaskPopup = await metamaskPopupPromise;
    await confirmMetamaskTransaction(metamaskPopup);

    const provider = new ethers.JsonRpcProvider(
      'https://evm.data.internal.testnet.us-east.production.kava.io',
    );
    const txHash = await page.getByTestId('tx-hash').innerText();
    const txInfo = await provider.getTransaction(txHash);

    //  Verify that the tx value is the amount from the user input
    const txValue: bigint = txInfo.value;

    expect(Number(txValue) / KAVA_EVM_DECIMALS).toBe(0.12345);
  });
  test('send tx (non-native asset)', async ({
    page,
    context,
    metaMaskExtensionId,
  }) => {
    const USDT_DECIMALS = 10 ** 6;
    test.setTimeout(90 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    const metaMask = await MetaMask.prepareWallet(context, metaMaskExtensionId);

    await metaMask.switchNetwork();

    //  be ready to find the upcoming popup
    const metamaskPopupPromise = context.waitForEvent('page');

    await chat.submitMessage(
      'Send 0.2345 USDT to 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D on Kava EVM Internal Testnet',
    );

    await chat.waitForStreamToFinish();

    //  Confirm the tx
    await chat.submitMessage('Yes');

    //  In progress
    await expect(page.getByTestId('in-progress-tx-display')).toBeVisible();

    const metamaskPopup = await metamaskPopupPromise;
    await metamaskPopup.pause();
    await confirmMetamaskTransaction(metamaskPopup);

    const provider = new ethers.JsonRpcProvider(
      'https://evm.data.internal.testnet.us-east.production.kava.io',
    );
    const txHash = await page.getByTestId('tx-hash').innerText();
    const txInfo = await provider.getTransaction(txHash);
    //
    // //  Verify that the tx data is the amount from the user input
    const txData = txInfo.data;
    const amountHex = txData.slice(-64);
    const amountBigInt = BigInt('0x' + amountHex);
    const formattedAmount = Number(amountBigInt) / USDT_DECIMALS;

    console.log({
      txData: txInfo.data,
      amountHex,
      rawAmount: amountBigInt.toString(),
      formattedAmount,
      USDT_DECIMALS,
    });
    expect(formattedAmount).toBe(0.2345);
  });
});
