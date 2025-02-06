import { describe, expect, test, retryButtonClick } from './fixtures';
import { Chat } from './Chat';
import { MetaMask } from './Metamask';
import { ethers } from 'ethers';
import { devices } from '@playwright/test';

describe('chat', () => {
  test('renders intro message', async ({ page }) => {
    const chat = new Chat(page);
    await chat.goto();

    //  todo - remove when the default (reasoning) model is functioning
    await chat.switchToBlockchainModel();

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

    //  todo - remove when the default (reasoning) model is functioning
    await chat.switchToBlockchainModel();

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

    await chat.switchToBlockchainModel();

    const metaMask = await MetaMask.prepareWallet(context, metaMaskExtensionId);

    await metaMask.switchNetwork();

    //  be ready to find the upcoming popup
    const metamaskPopupPromise = context.waitForEvent('page');

    await chat.submitMessage('What are my balances on Kava Internal Testnet?');

    await chat.waitForStreamToFinish();

    const metamaskPopup = await metamaskPopupPromise;

    await retryButtonClick(metamaskPopup, { name: 'Connect' });

    await chat.waitForStreamToFinish();
    await chat.waitForAssistantResponse();

    const amountElement = await page.getByTestId('TKAVA-query-amount');
    const amountText = await amountElement.textContent();

    const amount = parseFloat(amountText.replace(/,/g, ''));
    expect(amount).toBeGreaterThan(1000);
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

    await chat.switchToBlockchainModel();

    const metaMask = await MetaMask.prepareWallet(context, metaMaskExtensionId);

    await metaMask.switchNetwork();

    //  be ready to find the upcoming popup
    const metamaskPopupPromise = context.waitForEvent('page');

    await chat.submitMessage(
      'Send 0.12345 TKAVA to 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D on Kava EVM Internal Testnet',
    );

    await chat.waitForStreamToFinish();

    const metamaskPopup = await metamaskPopupPromise;
    await retryButtonClick(metamaskPopup, { name: 'Connect' });
    await retryButtonClick(metamaskPopup, { name: 'Confirm' });

    //  In progress
    await expect(page.getByTestId('in-progress-tx-display')).toBeVisible();

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

    await chat.switchToBlockchainModel();

    const metaMask = await MetaMask.prepareWallet(context, metaMaskExtensionId);

    await metaMask.switchNetwork();

    //  be ready to find the upcoming popup
    const metamaskPopupPromise = context.waitForEvent('page');

    await chat.submitMessage(
      'Send 0.2345 USDT to 0xC07918E451Ab77023a16Fa7515Dd60433A3c771D on Kava EVM Internal Testnet',
    );

    await chat.waitForStreamToFinish();

    const metamaskPopup = await metamaskPopupPromise;
    await retryButtonClick(metamaskPopup, { name: 'Connect' });
    await retryButtonClick(metamaskPopup, { name: 'Confirm' });

    //  In progress
    await expect(page.getByTestId('in-progress-tx-display')).toBeVisible();

    const provider = new ethers.JsonRpcProvider(
      'https://evm.data.internal.testnet.us-east.production.kava.io',
    );
    const txHash = await page.getByTestId('tx-hash').innerText();
    const txInfo = await provider.getTransaction(txHash);

    // Get the parsed transaction data using ethers interface
    const ethersInterface = new ethers.Interface([
      'function transfer(address to, uint256 amount)',
    ]);
    const decodedData = ethersInterface.parseTransaction({ data: txInfo.data });

    const amount = decodedData.args[1]; // Second argument is the amount
    const formattedAmount = Number(amount) / USDT_DECIMALS;

    expect(formattedAmount).toBe(0.2345);
  });
  test('model dropdown interactions', async ({ page }) => {
    const DEFAULT_MODEL_DISPLAY_NAME = 'DeepSeek RI 67TB';
    const DEFAULT_MODEL_DESCRIPTION = 'Logical Analysis Engine';
    const NUMBER_OF_SUPPORTED_MODELS = 2;
    const chat = new Chat(page);
    await chat.goto();

    const modelButton = page.getByRole('button', { name: 'Select model' });
    await expect(modelButton).toContainText(
      DEFAULT_MODEL_DISPLAY_NAME + DEFAULT_MODEL_DESCRIPTION,
    );

    // Open dropdown and verify options
    await modelButton.click();
    const dropdown = page.getByTestId('model-dropdown-menu');
    const dropdownOptions = await page.getByRole('option').all();
    await expect(dropdown).toBeVisible();
    expect(dropdownOptions).toHaveLength(NUMBER_OF_SUPPORTED_MODELS);

    // Select a different model
    const alternativeModel = page.getByRole('option').first();
    const alternativeModelName = await alternativeModel.textContent();
    expect(alternativeModelName).not.toBe(
      DEFAULT_MODEL_DISPLAY_NAME + DEFAULT_MODEL_DESCRIPTION,
    );
    await alternativeModel.click();

    // Verify dropdown closed and new model selected
    await expect(dropdown).not.toBeVisible();
    await expect(modelButton).toContainText(alternativeModelName);

    // // Change back to original model
    await modelButton.click();
    const originalModel = page.getByRole('option').nth(1);
    await originalModel.click();
    await expect(modelButton).toContainText(
      DEFAULT_MODEL_DISPLAY_NAME + DEFAULT_MODEL_DESCRIPTION,
    );

    // Type message to disable dropdown
    await chat.submitMessage('test message');

    await expect(modelButton).toBeDisabled();
  });
  test('model dropdown interactions in mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });

    const page = await context.newPage();

    const chat = new Chat(page);
    await chat.goto();

    const modelButton = page.getByRole('button', { name: 'Select model' });
    await modelButton.click();

    const blockchainModel = page
      .getByRole('option')
      .filter({ hasText: 'Blockchain Instruct' });
    // const gpt4oMini = page
    //   .getByRole('option')
    //   .filter({ hasText: 'Blockchain Instruct - mini' });
    const deepseek = page.getByRole('option').filter({ hasText: 'Deepseek' });

    await expect(blockchainModel).toBeDisabled();
    // await expect(gpt4oMini).toBeDisabled();
    await expect(deepseek).toBeEnabled();

    await context.close();
  });
});
