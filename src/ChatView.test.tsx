import { render } from '@testing-library/react';
import { ChatView, ChatViewProps } from './ChatView';

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
    const wrapper = render(<ChatView {...props} />);

    const input = wrapper.getByTestId('chat-view-input');

    expect(input).toHaveFocus();
  });
});
