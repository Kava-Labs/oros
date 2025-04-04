import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '../../shared/theme/themeProvider';
import ChatInput, { ChatInputProps } from './ChatInput';
import { vi } from 'vitest';
import { MODEL_REGISTRY } from '../config';

describe('ChatInput', () => {
  const props: ChatInputProps = {
    isRequesting: false,
    setShouldAutoScroll: vi.fn(),
    supportsUpload: true,
    startNewChat: vi.fn(),
    conversationID: 'foo',
    modelConfig: MODEL_REGISTRY['o3-mini'],
    handleCancel: vi.fn(),
    handleChatCompletion: vi.fn(),
  };

  test('input is focused by default', () => {
    const wrapper = render(
      <ThemeProvider>
        <ChatInput {...props} />
      </ThemeProvider>,
    );
    const input = wrapper.getByTestId('chat-view-input');
    expect(input).toHaveFocus();
  });
  test('send button is disabled when no input', () => {
    const wrapper = render(
      <ThemeProvider>
        <ChatInput {...props} />
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
        <ChatInput {...props} />
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
