import { render } from '@testing-library/react';
import { ChatView, ChatViewProps } from './ChatView';
import { ThemeProvider } from '../shared/theme/themeProvider';
import { AppContextProvider } from '../core/context/AppContextProvider';
import { TextStreamStore } from '../core/stores/textStreamStore';
import { ToolCallStreamStore } from '../core/stores/toolCallStreamStore';
import { MessageHistoryStore } from '../core/stores/messageHistoryStore';
import { WalletStore } from '../features/blockchain/stores//walletStore';
const messageStore = new TextStreamStore();
const progressStore = new TextStreamStore();
const toolCallStreamStore = new ToolCallStreamStore();
const messageHistoryStore = new MessageHistoryStore();
const walletStore = new WalletStore();

vi.mock(
  import('../features/blockchain/services/registry'),
  async (messageRegistry) => {
    return await messageRegistry();
  },
);

describe('ChatView', () => {
  const props: ChatViewProps = {
    messages: [],
    cautionText: '',
    introText: 'Foobar',
    onSubmit: () => {},
    onReset: () => {},
    onCancel: () => {},
  };

  test('input is focused by default', () => {
    const wrapper = render(
      <ThemeProvider>
        <AppContextProvider
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
