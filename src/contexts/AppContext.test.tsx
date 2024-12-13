import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Mock } from 'vitest';
import { AppContextProvider } from './AppContext';
import { useAppContext } from './AppContext';
import { createStore } from '../stores';
import * as utils from '../utils';
import type { ChatCompletionMessageParam } from 'openai/resources/index';

const systemPromptMessage = { role: 'system', content: 'the system prompt' };

const createTestStores = () => {
  const streamingMessageStore = createStore('');
  const messageHistoryStore = createStore<ChatCompletionMessageParam[]>([
    systemPromptMessage as any,
  ]);

  return {
    streamingMessageStore,
    messageHistoryStore,
  };
};

vi.mock('../utils', () => ({
  chat: vi.fn(),
  deleteImages: vi.fn(),
}));

describe('AppContextProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.ethereum
    window.ethereum = {
      request: vi.fn(),
    };
  });

  it('connects wallet and updates address', async () => {
    const mockAccounts = ['0x1234567890abcdef'];
    window.ethereum.request = vi.fn().mockResolvedValue(mockAccounts);
    const { streamingMessageStore, messageHistoryStore } = createTestStores();

    const TestComponent = () => {
      const { address, connectWallet } = useAppContext();

      return (
        <div>
          <span data-testid="address">{address}</span>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      );
    };

    render(
      <AppContextProvider
        streamingMessageStore={streamingMessageStore}
        messageHistoryStore={messageHistoryStore}
      >
        <TestComponent />
      </AppContextProvider>,
    );

    const button = screen.getByText('Connect Wallet');
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.ethereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });

    expect(screen.getByTestId('address').textContent).toBe(mockAccounts[0]);

    // Verify that messageHistoryAddMessage was dispatched

    expect(messageHistoryStore.getState()).toEqual([
      systemPromptMessage,
      {
        role: 'system',
        content: `user's current wallet address: ${mockAccounts[0]}`,
      },
    ]);
  });

  it('handles submitUserChatMessage correctly', () => {
    const mockChatCancel = vi.fn();
    const { streamingMessageStore, messageHistoryStore } = createTestStores();
    (utils.chat as Mock).mockReturnValue(mockChatCancel);

    const TestComponent = () => {
      const { submitUserChatMessage } = useAppContext();

      return (
        <button onClick={() => submitUserChatMessage('Hello')}>
          Submit Chat Message
        </button>
      );
    };

    render(
      <AppContextProvider
        streamingMessageStore={streamingMessageStore}
        messageHistoryStore={messageHistoryStore}
      >
        <TestComponent />
      </AppContextProvider>,
    );

    const button = screen.getByText('Submit Chat Message');
    fireEvent.click(button);

    expect(messageHistoryStore.getState().length).toBe(2);

    expect(messageHistoryStore.getState()).toEqual([
      systemPromptMessage,
      { role: 'user', content: 'Hello' },
    ]);

    // Verify that chat was called
    expect(utils.chat).toHaveBeenCalled();
  });

  it('handles cancelStream correctly', () => {
    const mockChatCancel = vi.fn();
    (utils.chat as Mock).mockReturnValue(mockChatCancel);
    const { streamingMessageStore, messageHistoryStore } = createTestStores();

    const TestComponent = () => {
      const { submitUserChatMessage, cancelStream } = useAppContext();

      return (
        <div>
          <button onClick={() => submitUserChatMessage('Hello')}>
            Submit Chat Message
          </button>
          {cancelStream && (
            <button onClick={cancelStream}>Cancel Stream</button>
          )}
        </div>
      );
    };

    render(
      <AppContextProvider
        streamingMessageStore={streamingMessageStore}
        messageHistoryStore={messageHistoryStore}
      >
        <TestComponent />
      </AppContextProvider>,
    );

    fireEvent.click(screen.getByText('Submit Chat Message'));

    expect(screen.getByText('Cancel Stream')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel Stream'));

    // Verify that mockChatCancel was called
    expect(mockChatCancel).toHaveBeenCalled();

    expect(messageHistoryStore.getState()).toEqual([systemPromptMessage]);
  });

  it('clears chat messages correctly', async () => {
    const { streamingMessageStore, messageHistoryStore } = createTestStores();

    const TestComponent = () => {
      const { clearChatMessages } = useAppContext();

      return (
        <div>
          <button onClick={clearChatMessages}>Clear Chat Messages</button>
        </div>
      );
    };

    render(
      <AppContextProvider
        streamingMessageStore={streamingMessageStore}
        messageHistoryStore={messageHistoryStore}
      >
        <TestComponent />
      </AppContextProvider>,
    );

    // Click the clearChatMessages button
    fireEvent.click(screen.getByText('Clear Chat Messages'));

    expect(messageHistoryStore.getState()).toEqual([systemPromptMessage]);

    await waitFor(() => {
      expect(utils.deleteImages as Mock).toHaveBeenCalledTimes(1);
    });
  });
});
