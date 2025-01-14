import { render } from '@testing-library/react';
import { ChatView, ChatViewProps } from './ChatView';
import { ThemeProvider } from './theme/themeProvider';

describe('ChatView', () => {
  const props: ChatViewProps = {
    messages: [],
    errorText: '',
    introText: 'Foobar',
    isRequesting: false,
    onSubmit: () => {},
    onReset: () => {},
    onCancel: () => {},
    address: '',
    chainID: '2222',
  };

  test('input is focused by default', () => {
    const wrapper = render(
      <ThemeProvider>
        <ChatView {...props} />
      </ThemeProvider>,
    );
    const input = wrapper.getByTestId('chat-view-input');
    expect(input).toHaveFocus();
  });
});
