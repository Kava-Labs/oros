import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import AssistantMessage from './AssistantMessage';
import { useIsMobile } from '../../../shared/theme/useIsMobile';
import { MODEL_REGISTRY } from '../../config';

// Mock the required modules and hooks
vi.mock('../../../shared/theme/useIsMobile');

/* Decided to mock these out instead of rendering them so we get
   a true unit test that isn't dependent on the other components.

   The markup from those components will be tested inside those
   unit tests
*/
vi.mock('./Content', () => ({
  Content: ({ content }: { content: string }) => (
    <div data-testid="content">{content}</div>
  ),
}));

vi.mock('./ThinkingContent', () => ({
  ThinkingContent: ({ content }: { content: string }) => (
    <div data-testid="thinking-content">{content}</div>
  ),
}));

describe('AssistantMessage', () => {
  const modelConfig = MODEL_REGISTRY['o3-mini'];
  const mockContent = 'Test message content';
  const mockReasoningContent = 'Test reasoning content';
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });
  });

  it('renders basic message content correctly', () => {
    render(
      <AssistantMessage content={mockContent} modelConfig={modelConfig} />,
    );

    expect(screen.getByTestId('content')).toHaveTextContent(mockContent);
    expect(screen.queryByTestId('thinking-content')).not.toBeInTheDocument();
  });

  it('renders reasoning content when provided', () => {
    render(
      <AssistantMessage
        content={mockContent}
        reasoningContent={mockReasoningContent}
        modelConfig={modelConfig}
      />,
    );

    expect(screen.getByTestId('thinking-content')).toHaveTextContent(
      mockReasoningContent,
    );
  });

  it('shows copy button on hover in desktop mode', () => {
    render(
      <AssistantMessage content={mockContent} modelConfig={modelConfig} />,
    );

    // Copy button should not be visible initially
    expect(screen.queryByLabelText('Copy Chat')).not.toBeInTheDocument();

    // Hover over the container
    fireEvent.mouseEnter(screen.getByTestId('content').parentElement!);
    expect(screen.getByLabelText('Copy Chat')).toBeInTheDocument();

    // Mouse leave
    fireEvent.mouseLeave(screen.getByTestId('content').parentElement!);
    expect(screen.queryByLabelText('Copy Chat')).not.toBeInTheDocument();
  });

  it('always shows copy button on mobile', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(
      <AssistantMessage content={mockContent} modelConfig={modelConfig} />,
    );

    expect(screen.getByLabelText('Copy Chat')).toBeInTheDocument();
  });

  it('copies content to clipboard when copy button is clicked', async () => {
    render(
      <AssistantMessage content={mockContent} modelConfig={modelConfig} />,
    );

    // Show copy button
    fireEvent.mouseEnter(screen.getByTestId('content').parentElement!);

    // Click copy button
    fireEvent.click(screen.getByLabelText('Copy Chat'));

    expect(mockWriteText).toHaveBeenCalledWith(mockContent.trim());
    expect(screen.getByLabelText('Chat Copied')).toBeInTheDocument();
  });

  it('shows success state temporarily after copying', async () => {
    vi.useFakeTimers();
    render(
      <AssistantMessage content={mockContent} modelConfig={modelConfig} />,
    );

    // Show and click copy button
    fireEvent.mouseEnter(screen.getByTestId('content').parentElement!);
    fireEvent.click(screen.getByLabelText('Copy Chat'));

    // Check success state
    expect(screen.getByLabelText('Chat Copied')).toBeInTheDocument();

    // Advance timers and check if success state is removed
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByLabelText('Chat Copied')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Copy Chat')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('maintains hover state when switching between copy and success icons', () => {
    render(
      <AssistantMessage content={mockContent} modelConfig={modelConfig} />,
    );

    const container = screen.getByTestId('content').parentElement!;

    // Initial hover
    fireEvent.mouseEnter(container);
    expect(screen.getByLabelText('Copy Chat')).toBeInTheDocument();

    // Click copy
    fireEvent.click(screen.getByLabelText('Copy Chat'));
    expect(screen.getByLabelText('Chat Copied')).toBeInTheDocument();

    // Maintain hover
    expect(screen.getByLabelText('Chat Copied')).toBeInTheDocument();
  });
});
