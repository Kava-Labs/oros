import { ChatView } from './ChatView';
import { render, screen, waitFor } from '@testing-library/react';

import { mockChatMessages } from './mockdata';

describe('ChatView', () => {
  describe('with no messages', () => {
    it('shows the get started with no props', () => {
      render(<ChatView />);

      const getStartedContainer = screen.getByTestId('start');

      expect(getStartedContainer).toHaveTextContent("Let's get started!");
    });

    it('shows the get started with empty messages', () => {
      render(<ChatView messages={[]} />);

      const getStartedContainer = screen.getByTestId('start');

      expect(getStartedContainer).toHaveTextContent("Let's get started!");
    });
  });

  describe('with messages', () => {
    it('renders all messages in the same order', () => {
      render(<ChatView messages={mockChatMessages} />);
    });

    it('renders assistant messages on the left', () => {
      render(<ChatView messages={mockChatMessages} />);
    });

    it('renders user messages on the left', () => {
      render(<ChatView messages={mockChatMessages} />);
    });

    it('renders all the messages in the array in order', () => {
      render(<ChatView messages={mockChatMessages} />);
    });
  });
});
