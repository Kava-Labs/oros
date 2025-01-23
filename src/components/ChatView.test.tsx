import { render } from '@testing-library/react';
import { ChatView, ChatViewProps } from './ChatView';
import { ThemeProvider } from '../theme/themeProvider';
import { AppContextProvider } from '../context/AppContextProvider';
import { WalletContextProvider } from '../context/WalletContextProvider';

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
        <WalletContextProvider>
          <AppContextProvider>
            <ChatView {...props} />
          </AppContextProvider>
        </WalletContextProvider>
      </ThemeProvider>,
    );
    const input = wrapper.getByTestId('chat-view-input');
    expect(input).toHaveFocus();
  });
});
