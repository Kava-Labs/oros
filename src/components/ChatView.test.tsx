import { render } from '@testing-library/react';
import { ChatView, ChatViewProps } from './ChatView';
import { ThemeProvider } from '../theme/themeProvider';
import { AppContextProvider } from '../context/AppContextProvider';

import { TextStreamStore } from './../textStreamStore';
import { ToolCallStreamStore } from './../toolCallStreamStore';
import { MessageHistoryStore } from './../messageHistoryStore';
import { WalletStore } from './../walletStore';

export const messageStore = new TextStreamStore();
export const progressStore = new TextStreamStore();
export const toolCallStreamStore = new ToolCallStreamStore();
export const messageHistoryStore = new MessageHistoryStore();
export const walletStore = new WalletStore();

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
