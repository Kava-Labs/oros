import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Mock } from 'vitest';
import { AppContextProvider } from './AppContext';
import { useAppContext } from './AppContext';
import * as stores from '../stores';
import * as utils from '../utils';

vi.mock('../stores', () => ({
  messageHistoryAddMessage: vi
    .fn()
    .mockReturnValue({ type: 'messageHistoryAddMessage' }),
  messageHistoryClear: vi.fn().mockReturnValue({ type: 'messageHistoryClear' }),
  messageHistoryDropLast: vi
    .fn()
    .mockReturnValue({ type: 'messageHistoryDropLast' }),
  selectMessageHistory: vi.fn().mockReturnValue([]),
  selectStreamingMessage: vi.fn().mockReturnValue(''),
  streamingMessageClear: vi
    .fn()
    .mockReturnValue({ type: 'streamingMessageClear' }),
  streamingMessageConcat: vi
    .fn()
    .mockReturnValue({ type: 'streamingMessageConcat' }),
  appStore: {
    dispatch: vi.fn(),
    getState: vi.fn(() => ({})),
  },
}));

vi.mock('../utils', () => ({
  chat: vi.fn(),
  deleteImages: vi.fn(),
}));

//  todo - unskip when this test is plugged into a redux provider
describe.skip('AppContextProvider', () => {
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
      <AppContextProvider>
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
    expect(stores.appStore.dispatch).toHaveBeenCalledWith(
      stores.messageHistoryAddMessage({
        role: 'system',
        content: `user's current wallet address: ${mockAccounts[0]}`,
      }),
    );
  });

  it('handles submitUserChatMessage correctly', () => {
    const mockChatCancel = vi.fn();
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
      <AppContextProvider>
        <TestComponent />
      </AppContextProvider>,
    );

    const button = screen.getByText('Submit Chat Message');
    fireEvent.click(button);

    // Verify that messageHistoryAddMessage was dispatched
    expect(stores.appStore.dispatch).toHaveBeenCalledWith(
      stores.messageHistoryAddMessage({ role: 'user', content: 'Hello' }),
    );

    // Verify that chat was called
    expect(utils.chat).toHaveBeenCalled();
  });

  it('handles cancelStream correctly', () => {
    const mockChatCancel = vi.fn();
    (utils.chat as Mock).mockReturnValue(mockChatCancel);

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
      <AppContextProvider>
        <TestComponent />
      </AppContextProvider>,
    );

    fireEvent.click(screen.getByText('Submit Chat Message'));

    expect(screen.getByText('Cancel Stream')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel Stream'));

    // Verify that mockChatCancel was called
    expect(mockChatCancel).toHaveBeenCalled();

    // Verify that streamingMessageClear and messageHistoryDropLast were dispatched
    expect(stores.appStore.dispatch).toHaveBeenCalledWith(
      stores.streamingMessageClear(),
    );
    expect(stores.appStore.dispatch).toHaveBeenCalledWith(
      stores.messageHistoryDropLast(),
    );
  });

  it('clears chat messages correctly', () => {
    const TestComponent = () => {
      const { clearChatMessages } = useAppContext();

      return (
        <div>
          <button onClick={clearChatMessages}>Clear Chat Messages</button>
        </div>
      );
    };

    render(
      <AppContextProvider>
        <TestComponent />
      </AppContextProvider>,
    );

    // Click the clearChatMessages button
    fireEvent.click(screen.getByText('Clear Chat Messages'));

    // Verify that messageHistoryClear was dispatched
    expect(stores.appStore.dispatch).toHaveBeenCalledWith(
      stores.messageHistoryClear(),
    );

    expect(utils.deleteImages as Mock).toHaveBeenCalled();
  });
});
