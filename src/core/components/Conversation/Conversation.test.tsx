import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Conversation } from './Conversation';
import { useAppContext } from '../../context/useAppContext';
import { useMessageHistory } from '../../hooks/useMessageHistory';
import { ToolMessageContainerProps } from './ToolMessageContainer';

// Mock the required modules and hooks
// TODO: Consider using AppContext so the data structure remains
//       the same instead of potentially producing false positives
vi.mock('../../context/useAppContext');
vi.mock('../../hooks/useMessageHistory');
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useSyncExternalStore: vi
      .fn()
      .mockImplementation((_, getSnapshot) => getSnapshot()),
  };
});

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
vi.mock('./ToolMessageContainer', () => ({
  ToolMessageContainer: ({
    message,
    onRendered,
  }: ToolMessageContainerProps) => (
    <div data-testid="tool-message" onClick={onRendered}>
      Tool:{' '}
      {typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content)}
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

// Mock the child components to reduce other component dependencies
vi.mock('./ToolCallProgressCards', () => ({
  ToolCallProgressCards: ({ onRendered }: { onRendered: () => void }) => (
    <div data-testid="tool-call-progress" onClick={onRendered}>
      Tool Call Progress
    </div>
  ),
}));

describe('Conversation', () => {
  const mockOnRendered = vi.fn();
  const mockSubscribe = vi.fn();
  const mockGetSnapshot = vi.fn().mockReturnValue('');

  beforeEach(() => {
    vi.clearAllMocks();

    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      errorStore: {
        subscribe: mockSubscribe,
        getSnapshot: mockGetSnapshot,
      },
      isRequesting: false,
    });

    (useMessageHistory as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [],
    });
  });

  it('renders empty conversation correctly', () => {
    render(<Conversation onRendered={mockOnRendered} />);

    expect(screen.getByTestId('conversation')).toBeInTheDocument();
    expect(screen.getByTestId('tool-call-progress')).toBeInTheDocument();
  });

  it.skip('renders user messages correctly', () => {
    (useMessageHistory as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'How are you?' },
      ],
    });

    render(<Conversation onRendered={mockOnRendered} />);

    const userMessages = screen.getAllByTestId('user-message');
    expect(userMessages).toHaveLength(2);
    expect(userMessages[0]).toHaveTextContent('Hello');
    expect(userMessages[1]).toHaveTextContent('How are you?');
  });

  it('renders assistant messages correctly', () => {
    (useMessageHistory as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [
        { role: 'assistant', content: 'I am an AI assistant' },
        {
          role: 'assistant',
          content: 'How can I help?',
          reasoningContent: 'Thinking about response',
        },
      ],
    });

    render(<Conversation onRendered={mockOnRendered} />);

    const assistantMessages = screen.getAllByTestId('assistant-message');
    expect(assistantMessages).toHaveLength(2);
    expect(assistantMessages[0]).toHaveTextContent('I am an AI assistant');
    expect(assistantMessages[1]).toHaveTextContent('How can I help?');

    const reasoningContent = screen.getByTestId('reasoning-content');
    expect(reasoningContent).toHaveTextContent('Thinking about response');
  });

  it('renders tool messages correctly', () => {
    (useMessageHistory as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      messages: [
        { role: 'assistant', content: 'I will use a tool' },
        { role: 'tool', content: 'Tool response' },
      ],
    });

    render(<Conversation onRendered={mockOnRendered} />);

    expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
    expect(screen.getByTestId('tool-message')).toBeInTheDocument();

    // Check that onRendered is passed correctly
    screen.getByTestId('tool-message').click();
    expect(mockOnRendered).toHaveBeenCalled();
  });

  it('renders streaming message when isRequesting is true', () => {
    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      errorStore: {
        subscribe: mockSubscribe,
        getSnapshot: mockGetSnapshot,
      },
      isRequesting: true,
    });

    render(<Conversation onRendered={mockOnRendered} />);

    expect(screen.getByTestId('streaming-message')).toBeInTheDocument();
  });

  it('renders error message when error exists', () => {
    const mockErrorText = 'An error occurred';

    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      errorStore: {
        subscribe: mockSubscribe,
        getSnapshot: vi.fn().mockReturnValue(mockErrorText),
      },
      isRequesting: false,
    });

    render(<Conversation onRendered={mockOnRendered} />);

    const errorMessage = screen.getByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(mockErrorText);
  });

  it('passes onRendered to error, streaming, and tool call progress components', () => {
    const mockErrorText = 'An error occurred';

    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      errorStore: {
        subscribe: mockSubscribe,
        getSnapshot: vi.fn().mockReturnValue(mockErrorText),
      },
      isRequesting: true,
    });

    render(<Conversation onRendered={mockOnRendered} />);

    // Click on all components that should receive onRendered
    screen.getByTestId('error-message').click();
    screen.getByTestId('streaming-message').click();
    screen.getByTestId('tool-call-progress').click();
    expect(mockOnRendered).toHaveBeenCalledTimes(3);
  });
});
