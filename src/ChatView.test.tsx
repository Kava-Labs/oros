import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatView } from './ChatView';
import type { ChatCompletionMessageParam } from 'openai';

describe('ChatView', () => {
  it('renders the start state when no props are provided', () => {
    render(<ChatView />);

    const startView = screen.getByTestId('start');

    expect(startView).toBeInTheDocument();
    expect(startView).toHaveTextContent("Let's get started!");
  });

  it('renders the start state when provided messages are empty', () => {
    render(<ChatView messages={[]} />);

    const startView = screen.getByTestId('start');

    expect(startView).toBeInTheDocument();
    expect(startView).toHaveTextContent("Let's get started!");
  });

  it('renders messages when they are provided', () => {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'assistant', content: 'Hello! How can I help you?' },
      { role: 'user', content: 'I want to create a new memecoin.' },
    ];

    render(<ChatView messages={messages} />);

    const conversation = screen.getByTestId('conversation');
    // Should not show the start state since messages exist
    expect(screen.queryByTestId('start')).toBeNull();

    // Check that both messages are rendered
    expect(conversation).toHaveTextContent('Hello! How can I help you?');
    expect(conversation).toHaveTextContent('I want to create a new memecoin.');
  });

  it('shows the chat icon for assistant messages', () => {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'assistant', content: 'I am here to assist.' },
      { role: 'user', content: 'Thanks for the help!' },
    ];

    render(<ChatView messages={messages} />);

    const assistantMessage = screen.getByText('I am here to assist.');
    // The assistant message container should have the chat icon
    const assistantContainer = assistantMessage.closest('div');
    const icon = assistantContainer?.querySelector('img');
    expect(icon).toBeInTheDocument(); // Icon should be present for assistant

    const userMessage = screen.getByText('Thanks for the help!');
    const userContainer = userMessage.closest('div');
    const userIcon = userContainer?.querySelector('img');
    // Icon should not be present for user messages
    expect(userIcon).not.toBeInTheDocument();
  });

  it('shows the important info in the controls section', () => {
    render(<ChatView messages={[]} />);

    const importantInfo = screen.getByTestId('importantInfo');
    expect(importantInfo).toBeInTheDocument();
    expect(importantInfo).toHaveTextContent(
      'This application may produce errors and incorrect information.',
    );
  });

  it('shows the warning message', () => {
    render(<ChatView messages={[]} />);

    const sendChatButton = screen.getByLabelText('Send Chat');
    expect(sendChatButton).toBeInTheDocument();

    fireEvent.click(sendChatButton);
    // assert some function was called when wired in
  });
});
