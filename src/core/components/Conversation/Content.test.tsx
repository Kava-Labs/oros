import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Content, ContentComponent } from './Content';
import { sanitizeContent } from 'lib-kava-ai';
import { MODEL_REGISTRY } from '../../config';

// Mock the required modules and hooks
vi.mock('lib-kava-ai');
vi.mock('../../context/useAppContext');

describe('Content Component', () => {
  const modelConfig = MODEL_REGISTRY['o3-mini'];
  const mockContent = 'Test content';
  const mockSanitizedContent = '<p>Sanitized content</p>';
  const mockOnRendered = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock sanitizeContent function with simple sanitization
    (sanitizeContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSanitizedContent,
    );

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
  });

  it('renders sanitized content correctly', async () => {
    render(
      <ContentComponent
        content={mockContent}
        role="user"
        modelConfig={modelConfig}
      />,
    );

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
    render(
      <ContentComponent content="" role="user" modelConfig={modelConfig} />,
    );

    expect(sanitizeContent).not.toHaveBeenCalled();

    await waitFor(() => {
      const contentElement = screen.getByTestId('conversation-message');
      expect(contentElement.innerHTML).toBe('');
    });
  });

  it('calls onRendered callback after rendering', async () => {
    render(
      <ContentComponent
        content={mockContent}
        role="user"
        onRendered={mockOnRendered}
        modelConfig={modelConfig}
      />,
    );

    await waitFor(() => {
      expect(mockOnRendered).toHaveBeenCalledTimes(1);
    });
  });

  it('uses model-specific processor if available', async () => {
    const mockPostProcess = vi.fn().mockReturnValue('Processed content');

    const modelConfigWithProcessor = {
      ...modelConfig,
      messageProcessors: {
        postProcess: mockPostProcess,
      },
    };

    render(
      <ContentComponent
        content={mockContent}
        role="user"
        modelConfig={modelConfigWithProcessor}
      />,
    );

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockPostProcess).toHaveBeenCalledWith(mockContent);
      expect(sanitizeContent).toHaveBeenCalledWith('Processed content');
    });
  });
  it('memoizes correctly', async () => {
    const { rerender } = render(
      <Content content={mockContent} role="user" modelConfig={modelConfig} />,
    );

    // Wait for the async state updates to complete
    await waitFor(() => {
      expect(sanitizeContent).toHaveBeenCalledTimes(1);
    });

    // Rerender with the same props
    rerender(
      <Content content={mockContent} role="user" modelConfig={modelConfig} />,
    );

    // Wait again for any potential async updates
    await waitFor(() => {
      // Should not call sanitizeContent again due to memoization
      expect(sanitizeContent).toHaveBeenCalledTimes(1);
    });

    // Rerender with different props
    rerender(
      <Content content="New content" role="user" modelConfig={modelConfig} />,
    );

    await waitFor(() => {
      expect(sanitizeContent).toHaveBeenCalledTimes(2);
    });
  });
});
