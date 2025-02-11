import { describe, expect, test, retryButtonClick } from './fixtures';
import { Chat } from './Chat';
import { MetaMask } from './Metamask';
import { ethers } from 'ethers';
import { devices } from '@playwright/test';

describe('chat', () => {
  test('renders intro messages by model', async ({ page }) => {
    const initialIntroMessage = 'What can I help you with?';
    const chat = new Chat(page);
    await chat.goto();

    expect(chat.messageContainer).not.toBeNull();
    await expect(page.getByText(initialIntroMessage)).toBeVisible();

    await chat.switchToBlockchainModel();

    const updatedIntroMessage = 'How can I help you with Web3?';

    await expect(page.getByText(initialIntroMessage)).not.toBeVisible();
    await expect(page.getByText(updatedIntroMessage)).toBeVisible();
  });

  test('receiving a response from the model', async ({ page }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    //  todo - remove when the default (reasoning) model is quicker
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
    const DEFAULT_MODEL_DISPLAY_NAME = 'General Reasoning';
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

    const reasoningModel = page
      .getByRole('option')
      .filter({ hasText: 'General Reasoning' });

    await expect(blockchainModel).toBeDisabled();
    await expect(reasoningModel).toBeEnabled();

    await context.close();
  });
  test('chat history', async ({ page }) => {
    test.setTimeout(90 * 1000);

    const chat = new Chat(page);
    await chat.goto();

    //  this test runs very slowly on the reasoning model
    await chat.switchToBlockchainModel();

    await chat.submitMessage(
      'This is an automated test suite, please respond with the exact text: THIS IS A TEST',
    );

    await chat.waitForStreamToFinish();
    await chat.waitForAssistantResponse();

    const initialHistoryTitle = await page
      .getByTestId('chat-history-entry')
      .first()
      .textContent();

    expect(initialHistoryTitle).not.toBe('');

    const newChatIcon = page.getByRole('button', { name: 'New Chat' });
    await newChatIcon.click();

    await chat.submitMessage(
      'Can you help me move my blockchain asset from one chain to another?',
    );

    await chat.waitForStreamToFinish();
    await chat.waitForAssistantResponse();

    //  Switching between conversation histories
    const currentConversation = await chat.getMessageElementsWithContent();
    const currentResponse =
      await currentConversation[currentConversation.length - 1].innerText();

    const initialConversation = page.getByTestId('chat-history-entry').nth(1);
    await initialConversation.click();

    const updatedConversation = await chat.getMessageElementsWithContent();
    const updatedResponse =
      await updatedConversation[updatedConversation.length - 1].innerText();

    expect(updatedResponse).not.toEqual(currentResponse);

    //  switch back to the initial conversation
    const secondConversation = page.getByTestId('chat-history-entry').nth(1);
    await secondConversation.click();

    const conversation = await chat.getMessageElementsWithContent();
    const response = await conversation[conversation.length - 1].innerText();

    expect(response).toBe(currentResponse);

    //  Deleting entries
    const secondHistoryTitle = await secondConversation.textContent();

    expect(secondHistoryTitle).not.toBe('');
    expect(secondHistoryTitle).not.toBe(initialHistoryTitle);

    const historyEntries = await page.getByTestId('chat-history-entry').all();
    expect(historyEntries).toHaveLength(2);

    // let deleteIcon = page.getByTestId('delete-chat-history-entry-icon').first();
    // await deleteIcon.waitFor({ state: 'visible' });
    // await deleteIcon.click({ force: true });

    // historyEntries = await page.getByTestId('chat-history-entry').all();
    // expect(historyEntries).toHaveLength(1);

    // deleteIcon = page.getByTestId('delete-chat-history-entry-icon').first();
    // await deleteIcon.waitFor({ state: 'visible' });
    // await deleteIcon.click({ force: true });

    // historyEntries = await page.getByTestId('chat-history-entry').all();
    // expect(historyEntries).toHaveLength(0);
  });
  test('conversation history from local storage populates the UI', async ({
    page,
  }) => {
    const chat = new Chat(page);

    await page.addInitScript(() => {
      localStorage.setItem(
        'conversations',
        JSON.stringify({
          'test-id': {
            id: 'test-id',
            model: 'test-model',
            title: 'Test Conversation Title',
            conversation: [
              {
                role: 'user',
                content: 'test message',
              },
            ],
            lastSaved: Date.now(),
          },
        }),
      );
    });

    await chat.goto();

    const historyEntry = page.getByTestId('chat-history-entry').first();
    await expect(historyEntry).toHaveText('Test Conversation Title');

    //  still there after a refresh/reload
    await page.reload();

    await expect(historyEntry).toHaveText('Test Conversation Title');
  });
});
