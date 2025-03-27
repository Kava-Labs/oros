import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '../../shared/theme/themeProvider';
import { AppContextProvider } from '../context/AppContextProvider';
import { TextStreamStore } from '../stores/textStreamStore';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import ChatInput from './ChatInput';
import { vi } from 'vitest';

describe('ChatInput', () => {
  const messageStore = new TextStreamStore();
  const progressStore = new TextStreamStore();
  const messageHistoryStore = new MessageHistoryStore();
  const thinkingStore = new TextStreamStore();
  const errorStore = new TextStreamStore();

  const props = {
    setShouldAutoScroll: vi.fn(),
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
  };

  test('input is focused by default', () => {
    const wrapper = render(
      <ThemeProvider>
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <ChatInput {...props} />
        </AppContextProvider>
      </ThemeProvider>,
    );
    const input = wrapper.getByTestId('chat-view-input');
    expect(input).toHaveFocus();
  });
  test('send button is disabled when no input', () => {
    const wrapper = render(
      <ThemeProvider>
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <ChatInput {...props} />
        </AppContextProvider>
      </ThemeProvider>,
    );
    const input = wrapper.getByTestId('chat-view-input');

    const sendChatButton = wrapper.getByRole('button', { name: 'Send Chat' });

    expect(sendChatButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'How are you?' } });
    expect(sendChatButton).toBeEnabled();
  });
  test('Inputs larger than the available context window disable the send button', () => {
    const wrapper = render(
      <ThemeProvider>
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <ChatInput {...props} />
        </AppContextProvider>
      </ThemeProvider>,
    );
    const input = wrapper.getByTestId('chat-view-input');

    const sendChatButton = wrapper.getByRole('button', { name: 'Send Chat' });

    fireEvent.change(input, { target: { value: 'Token '.repeat(10) } });
    expect(sendChatButton).toBeEnabled();

    fireEvent.change(input, { target: { value: 'Token '.repeat(10 ** 6) } });
    expect(sendChatButton).toBeDisabled();
  });
});
