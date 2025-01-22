import { render } from '@testing-library/react';
import { ChatView, ChatViewProps } from './ChatView';
import { ThemeProvider } from './theme/themeProvider';
import { AppContextProvider } from './AppContext';

describe('ChatView', () => {
  const props: ChatViewProps = {
    messages: [],
    cautionText: '',
    introText: 'Foobar',
    onSubmit: () => {},
    onReset: () => {},
    onCancel: () => {},
    address: '',
    chainID: '2222',
  };

  test('input is focused by default', () => {
    const wrapper = render(
      <ThemeProvider>
        <AppContextProvider>
          <ChatView {...props} />
        </AppContextProvider>
      </ThemeProvider>,
    );
    const input = wrapper.getByTestId('chat-view-input');
    expect(input).toHaveFocus();
  });
});
