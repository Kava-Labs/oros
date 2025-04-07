import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Conversation } from './Conversation';
import { MODEL_REGISTRY } from '../../config';
import { ChatMessage } from '../../stores/messageHistoryStore';
import { TextStreamStore } from 'lib-kava-ai';

// Mock the child components to reduce other component dependencies
vi.mock('./UserMessage', () => ({
  UserMessage: ({ content }: { content: string }) => (
    <div data-testid="user-message">{content}</div>
  ),
}));

// Mock the child components to reduce other component dependencies
vi.mock('./AssistantMessage', () => ({
  default: ({
    content,
    reasoningContent,
  }: {
    content: string;
    reasoningContent?: string;
  }) => (
    <div data-testid="assistant-message">
      <div>{content}</div>
      {reasoningContent && (
        <div data-testid="reasoning-content">{reasoningContent}</div>
      )}
    </div>
  ),
}));

// Mock the child components to reduce other component dependencies
vi.mock('./StreamingMessage', () => ({
  StreamingMessage: ({ onRendered }: { onRendered: () => void }) => (
    <div data-testid="streaming-message" onClick={onRendered}>
      Streaming
    </div>
  ),
}));

// Mock the child components to reduce other component dependencies
vi.mock('./ErrorMessage', () => ({
  ErrorMessage: ({
    errorText,
    onRendered,
  }: {
    errorText: string;
    onRendered: () => void;
  }) => (
    <div data-testid="error-message" onClick={onRendered}>
      {errorText}
    </div>
  ),
}));

describe('Conversation', () => {
  const modelConfig = MODEL_REGISTRY['o3-mini'];
  const mockOnRendered = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty conversation correctly', () => {
    render(
      <Conversation
        messages={[]}
        errorStore={new TextStreamStore()}
        messageStore={new TextStreamStore()}
        isRequesting={false}
        thinkingStore={new TextStreamStore()}
        onRendered={mockOnRendered}
        modelConfig={modelConfig}
      />,
    );

    expect(screen.getByTestId('conversation')).toBeInTheDocument();
  });

  it.skip('renders user messages correctly', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'user', content: 'How are you?' },
    ];

    render(
      <Conversation
        messages={mockMessages}
        errorStore={new TextStreamStore()}
        messageStore={new TextStreamStore()}
        isRequesting={false}
        thinkingStore={new TextStreamStore()}
        onRendered={mockOnRendered}
        modelConfig={modelConfig}
      />,
    );

    const userMessages = screen.getAllByTestId('user-message');
    expect(userMessages).toHaveLength(2);
    expect(userMessages[0]).toHaveTextContent('Hello');
    expect(userMessages[1]).toHaveTextContent('How are you?');
  });

  it('renders assistant messages correctly', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'assistant', content: 'I am an AI assistant' },
      {
        role: 'assistant',
        content: 'How can I help?',
        reasoningContent: 'Thinking about response',
      },
    ];

    render(
      <Conversation
        messages={mockMessages}
        errorStore={new TextStreamStore()}
        messageStore={new TextStreamStore()}
        isRequesting={false}
        thinkingStore={new TextStreamStore()}
        onRendered={mockOnRendered}
        modelConfig={modelConfig}
      />,
    );

    const assistantMessages = screen.getAllByTestId('assistant-message');
    expect(assistantMessages).toHaveLength(2);
    expect(assistantMessages[0]).toHaveTextContent('I am an AI assistant');
    expect(assistantMessages[1]).toHaveTextContent('How can I help?');

    const reasoningContent = screen.getByTestId('reasoning-content');
    expect(reasoningContent).toHaveTextContent('Thinking about response');
  });

  it('renders progress icon when isRequesting is true before assistant stream starts', () => {
    render(
      <Conversation
        messages={[]}
        errorStore={new TextStreamStore()}
        messageStore={new TextStreamStore()}
        isRequesting={true}
        thinkingStore={new TextStreamStore()}
        onRendered={mockOnRendered}
        modelConfig={modelConfig}
      />,
    );

    expect(screen.getByLabelText('Progress Icon')).toBeInTheDocument();
  });

  it('hides progress icon when isRequesting is true and assistant stream starts', () => {
    render(
      <Conversation
        messages={[]}
        errorStore={new TextStreamStore()}
        messageStore={new TextStreamStore()}
        isRequesting={false}
        thinkingStore={new TextStreamStore()}
        onRendered={mockOnRendered}
        modelConfig={modelConfig}
      />,
    );

    expect(screen.queryByLabelText('Progress Icon')).not.toBeInTheDocument();
  });

  it('renders error message when error exists', () => {
    const mockErrorText = 'An error occurred';

    const errorStore = new TextStreamStore();
    errorStore.setText(mockErrorText);

    render(
      <Conversation
        messages={[]}
        errorStore={errorStore}
        messageStore={new TextStreamStore()}
        isRequesting={false}
        thinkingStore={new TextStreamStore()}
        onRendered={mockOnRendered}
        modelConfig={modelConfig}
      />,
    );

    const errorMessage = screen.getByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(mockErrorText);
  });
});
