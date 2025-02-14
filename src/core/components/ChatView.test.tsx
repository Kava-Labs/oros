import { render } from '@testing-library/react';
import { ChatView, ChatViewProps } from './ChatView';
import { ThemeProvider } from '../../shared/theme/themeProvider';
import { AppContextProvider } from '../context/AppContextProvider';
import { TextStreamStore } from '../stores/textStreamStore';
import { ToolCallStreamStore } from '../stores/toolCallStreamStore';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { WalletStore } from '../../features/blockchain/stores/walletStore';
const messageStore = new TextStreamStore();
const progressStore = new TextStreamStore();
const toolCallStreamStore = new ToolCallStreamStore();
const messageHistoryStore = new MessageHistoryStore();
const walletStore = new WalletStore();
const thinkingStore = new TextStreamStore();

vi.mock(
  import('../../features/blockchain/services/registry'),
  async (messageRegistry) => {
    return await messageRegistry();
  },
);

describe('ChatView', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  const props: ChatViewProps = {
    messages: [],
    cautionText: '',
    introText: 'Foobar',
    onSubmit: () => {},
    onCancel: () => {},
    onMenu: () => {},
    onNewChat: () => {},
    onPanelOpen: () => {},
    isPanelOpen: false,
  };

  test('input is focused by default', () => {
    const wrapper = render(
      <ThemeProvider>
        <AppContextProvider
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          toolCallStreamStore={toolCallStreamStore}
          walletStore={walletStore}
          messageHistoryStore={messageHistoryStore}
        >
          <ChatView {...props} />
        </AppContextProvider>
      </ThemeProvider>,
    );
    const input = wrapper.getByTestId('chat-view-input');
    expect(input).toHaveFocus();
  });
});
