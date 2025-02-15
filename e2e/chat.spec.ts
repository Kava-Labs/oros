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
    const amountText = (await amountElement.textContent()) || '';

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
    const NUMBER_OF_SUPPORTED_MODELS = 2;
    const chat = new Chat(page);
    await chat.goto();

    // Select model button
    const modelButton = page.getByRole('combobox', { name: 'Select Model' });
    await expect(modelButton).toContainText(DEFAULT_MODEL_DISPLAY_NAME);
    await expect(modelButton).toHaveAttribute('aria-expanded', 'false');

    // Open dropdown and verify options
    await modelButton.click();
    const dropdown = page.getByRole('listbox');
    const dropdownOptions = await page.getByRole('option').all();

    await expect(dropdown).toBeVisible();
    expect(dropdownOptions).toHaveLength(NUMBER_OF_SUPPORTED_MODELS);
    await expect(modelButton).toHaveAttribute('aria-expanded', 'true');

    // Select a different model
    const alternativeModel = page
      .getByRole('option')
      .filter({ hasText: 'Blockchain Instruct' });
    const alternativeModelName =
      (await alternativeModel.locator('span').first().textContent()) || '';

    expect(alternativeModelName).not.toBe(DEFAULT_MODEL_DISPLAY_NAME);
    await alternativeModel.click();

    // Verify dropdown closed and new model selected
    await expect(dropdown).not.toBeVisible();
    await expect(modelButton).toContainText(alternativeModelName);
    await expect(modelButton).toHaveAttribute('aria-expanded', 'false');

    // Change back to original model
    await modelButton.click();
    const originalModel = page.getByRole('option', {
      name: DEFAULT_MODEL_DISPLAY_NAME,
    });
    await originalModel.click();
    await expect(modelButton).toContainText(DEFAULT_MODEL_DISPLAY_NAME);

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

    const modelButton = page.getByRole('combobox', { name: 'Select Model' });
    await modelButton.click();

    const dropdown = page.getByRole('listbox');
    await expect(dropdown).toBeVisible();

    const blockchainModel = page
      .getByRole('option')
      .filter({ hasText: 'Blockchain Instruct' });
    const reasoningModel = page
      .getByRole('option')
      .filter({ hasText: 'General Reasoning' });

    await expect(blockchainModel).toBeEnabled();
    await expect(reasoningModel).toBeEnabled();

    await blockchainModel.click();
    await expect(modelButton).toContainText('Blockchain Instruct');

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
    let blockchainQuestionConversation =
      await chat.getMessageElementsWithContent();
    const blockchainQuestionConversationResponse =
      await blockchainQuestionConversation[
        blockchainQuestionConversation.length - 1
      ].innerText();

    const thisIsATestConversation = page
      .getByTestId('chat-history-entry')
      .nth(1);
    await thisIsATestConversation.click();

    const currentInViewConversation =
      await chat.getMessageElementsWithContent();
    const currentInViewResponse =
      await currentInViewConversation[
        currentInViewConversation.length - 1
      ].innerText();

    expect(currentInViewResponse).not.toEqual(
      blockchainQuestionConversationResponse,
    );

    //  switch back to the initial conversation
    const blockChainHistoryItem = page
      .getByTestId('chat-history-entry')
      .first();
    await blockChainHistoryItem.click();

    blockchainQuestionConversation = await chat.getMessageElementsWithContent();
    const newBlockChainConversationResponse =
      await blockchainQuestionConversation[
        blockchainQuestionConversation.length - 1
      ].innerText();

    expect(newBlockChainConversationResponse).toBe(
      blockchainQuestionConversationResponse,
    );

    //  Deleting entries
    const secondHistoryTitle = await blockChainHistoryItem.textContent();

    expect(secondHistoryTitle).not.toBe('');
    expect(secondHistoryTitle).not.toBe(initialHistoryTitle);

    let historyEntryTexts = await page.getByTestId('chat-history-entry').all();
    expect(historyEntryTexts).toHaveLength(2);

    const chatOptionButtons = await page.getByLabel('Chat Options').all();
    expect(chatOptionButtons).toHaveLength(2);

    // Get the first chat history entry Chat Option button
    const firstChatOptionButton = chatOptionButtons[0];

    // Find and click the "Chat Options" button inside the first entry
    await firstChatOptionButton.click();

    await page.locator(`[aria-label="Delete Chat"]`).first().click();
    await historyEntryTexts[1].waitFor({ state: 'detached' });
    historyEntryTexts = await page.getByTestId('chat-history-entry').all();

    expect(historyEntryTexts).toHaveLength(1);

    // Get the only remaining chat history entry Chat Option button
    const lastChatOptionButton = chatOptionButtons[0];

    // Find and click the "Chat Options" button inside the first entry
    await lastChatOptionButton.click();
    await page.locator(`[aria-label="Delete Chat"]`).first().click();
    await historyEntryTexts[0].waitFor({ state: 'detached' });
    historyEntryTexts = await page.getByTestId('chat-history-entry').all();
    expect(historyEntryTexts).toHaveLength(0);
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

  test('conversation search functionality', async ({ page }) => {
    const chat = new Chat(page);

    await page.addInitScript(() => {
      const systemPrompt = {
        role: 'system',
        content:
          'You are an AI assistant knowledgeable about blockchain technologies.',
      };

      localStorage.setItem(
        'conversations',
        JSON.stringify({
          'test-id-1': {
            id: 'test-id-1',
            model: 'test-model',
            title: 'Blockchain Discussion',
            conversation: [
              systemPrompt,
              {
                role: 'user',
                content:
                  'Tell me about blockchain technology and its applications',
              },
              {
                role: 'assistant',
                content:
                  'Blockchain is a decentralized digital ledger technology.',
              },
            ],
            lastSaved: Date.now(),
          },
          'test-id-2': {
            id: 'test-id-2',
            model: 'test-model',
            title: 'Machine Learning Chat',
            conversation: [
              systemPrompt,
              {
                role: 'user',
                content: 'Explain machine learning algorithms',
              },
              {
                role: 'assistant',
                content:
                  'Machine learning involves training models to make predictions.',
              },
            ],
            lastSaved: Date.now() - 1000,
          },
          'test-id-3': {
            id: 'test-id-3',
            model: 'test-model',
            title: 'API Integration Help',
            conversation: [
              systemPrompt,
              {
                role: 'user',
                content: 'How to integrate RESTful APIs effectively',
              },
              {
                role: 'assistant',
                content:
                  'API integration involves connecting different software systems.',
              },
            ],
            lastSaved: Date.now() - 2000,
          },
          'test-id-4': {
            id: 'test-id-4',
            model: 'test-model',
            title: 'Complex Search Scenario',
            conversation: [
              systemPrompt,
              {
                role: 'user',
                content: 'Initial question about general topics',
              },
              {
                role: 'assistant',
                content: 'Search functionality can be complex and nuanced.',
              },
              {
                role: 'user',
                content:
                  'Now I want to discuss advanced search functionality in depth',
              },
            ],
            lastSaved: Date.now() - 3000,
          },
        }),
      );
    });

    await chat.goto();

    const searchButton = page.getByRole('button', { name: 'Search History' });
    await searchButton.click();

    const modalEntries = page.getByTestId('search-chat-history-entry');
    await expect(modalEntries).toHaveCount(4);

    // Test searching by title
    const searchInput = page.getByPlaceholder('Search conversations...');
    await searchInput.fill('Blo');

    let filteredEntries = page.getByTestId('search-chat-history-entry');
    await expect(filteredEntries).toHaveCount(1);

    const filteredTitle = filteredEntries
      .first()
      .getByTestId('search-history-title');
    await expect(filteredTitle).toHaveText('Blockchain Discussion');

    await searchInput.clear();

    // Test searching by conversation content
    await searchInput.fill('decentralized');
    filteredEntries = page.getByTestId('search-chat-history-entry');
    await expect(filteredEntries).toHaveCount(1);

    const contentTitle = filteredEntries
      .first()
      .getByTestId('search-history-title');
    await expect(contentTitle).toHaveText('Blockchain Discussion');

    const contentSnippet = filteredEntries
      .first()
      .getByTestId('search-history-content');
    await expect(contentSnippet).toContainText(
      'decentralized digital ledger technology.',
    );

    // Test title & snippet match behavior
    await searchInput.clear();
    await searchInput.fill('Complex');

    filteredEntries = page.getByTestId('search-chat-history-entry');
    await expect(filteredEntries).toHaveCount(1);

    const titleMatchTitle = filteredEntries
      .first()
      .getByTestId('search-history-title');
    await expect(titleMatchTitle).toHaveText('Complex Search Scenario');

    const titleMatchSnippet = filteredEntries
      .first()
      .getByTestId('search-history-content');
    await expect(titleMatchSnippet).toContainText('complex and nuanced');

    // Test content match in second user message
    await searchInput.clear();
    await searchInput.fill('advanced');
    filteredEntries = page.getByTestId('search-chat-history-entry');
    await expect(filteredEntries).toHaveCount(1);

    const contentMatchTitle = filteredEntries
      .first()
      .getByTestId('search-history-title');
    await expect(contentMatchTitle).toHaveText('Complex Search Scenario');

    const contentMatchSnippet = filteredEntries
      .first()
      .getByTestId('search-history-content');
    await expect(contentMatchSnippet).toContainText(
      'advanced search functionality in depth',
    );

    // Clear the search & verify all conversations are visible again
    await searchInput.clear();
    await expect(page.getByTestId('search-chat-history-entry')).toHaveCount(4);

    //  Test no results
    await searchInput.clear();
    await searchInput.fill('asdfffewf');

    const noResults = page.getByText('No results');
    await expect(noResults).toBeVisible();

    // Test closing by clicking outside
    await page.mouse.click(0, 0);
    await expect(searchInput).not.toBeVisible();
  });

  test('search modal button is disabled for a user with no history', async ({
    page,
  }) => {
    const chat = new Chat(page);

    await chat.goto();

    //  explicitly removing any conversations from local storage, simulating a new user
    //  or if a user clears their browser cache
    await page.addInitScript(() => {
      localStorage.removeItem('conversations');
    });

    const searchButton = page.getByRole('button', { name: 'Search History' });
    await expect(searchButton).toBeDisabled();
  });
});
