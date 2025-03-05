import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { Content, ContentComponent } from './Content';
import { sanitizeContent } from '../../utils/sanitize';
import { useAppContext } from '../../context/useAppContext';

// Mock the required modules and hooks
vi.mock('../../utils/sanitize');
vi.mock('../../context/useAppContext');

describe('Content Component', () => {
  const mockContent = 'Test content';
  const mockSanitizedContent = '<p>Sanitized content</p>';
  const mockOnRendered = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock sanitizeContent function with simple sanitization
    (sanitizeContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSanitizedContent,
    );

    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      modelConfig: {
        messageProcessors: null,
      },
    });

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
  });

  it('renders sanitized content correctly', async () => {
    render(<ContentComponent content={mockContent} role="user" />);

    // Should call sanitizeContent with the content
    expect(sanitizeContent).toHaveBeenCalledWith(mockContent);

    // Wait for content to be sanitized and rendered
    await waitFor(() => {
      const contentElement = screen.getByTestId('conversation-message');
      expect(contentElement).toHaveAttribute('data-chat-role', 'user');
      expect(contentElement.innerHTML).toContain(mockSanitizedContent);
    });
  });

  it('handles empty content', async () => {
    render(<ContentComponent content="" role="user" />);

    expect(sanitizeContent).not.toHaveBeenCalled();

    await waitFor(() => {
      const contentElement = screen.getByTestId('conversation-message');
      expect(contentElement.innerHTML).toBe('');
    });
  });

  it('shows error message when sanitization fails', async () => {
    // Mock sanitizeContent to throw an error
    (sanitizeContent as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Sanitization error'),
    );

    render(<ContentComponent content={mockContent} role="user" />);

    await waitFor(() => {
      expect(
        screen.getByText('Error: Could not render content!'),
      ).toBeInTheDocument();
    });
  });

  it('calls onRendered callback after rendering', async () => {
    render(
      <ContentComponent
        content={mockContent}
        role="user"
        onRendered={mockOnRendered}
      />,
    );

    await waitFor(() => {
      expect(mockOnRendered).toHaveBeenCalledTimes(1);
    });
  });

  it('uses model-specific processor if available', async () => {
    const mockPostProcess = vi.fn().mockReturnValue('Processed content');

    // Update useAppContext mock to include a processor
    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      modelConfig: {
        messageProcessors: {
          postProcess: mockPostProcess,
        },
      },
    });

    render(<ContentComponent content={mockContent} role="user" />);
    expect(mockPostProcess).toHaveBeenCalledWith(mockContent);
    expect(sanitizeContent).toHaveBeenCalledWith('Processed content');
  });

  it('memoizes correctly', () => {
    const { rerender } = render(<Content content={mockContent} role="user" />);
    expect(sanitizeContent).toHaveBeenCalledTimes(1);

    // Rerender with the same props
    rerender(<Content content={mockContent} role="user" />);

    // Should not call sanitizeContent again due to memoization
    expect(sanitizeContent).toHaveBeenCalledTimes(1);

    // Rerender with different props
    rerender(<Content content="New content" role="user" />);
    expect(sanitizeContent).toHaveBeenCalledTimes(2);
  });
});
