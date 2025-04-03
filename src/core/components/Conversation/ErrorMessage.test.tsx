import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorMessage } from './ErrorMessage';
import { MODEL_REGISTRY } from '../../config';

vi.mock('./Content', () => ({
  Content: ({
    content,
    onRendered,
    role,
  }: {
    content: string;
    onRendered: () => void;
    role: string;
  }) => (
    <div data-testid="content" data-role={role} onClick={onRendered}>
      {content}
    </div>
  ),
}));

describe('ErrorMessage', () => {
  const modelConfig = MODEL_REGISTRY['o3-mini'];
  const mockErrorText = 'An error occurred';
  const mockOnRendered = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with error text content', () => {
    render(
      <ErrorMessage
        errorText={mockErrorText}
        onRendered={mockOnRendered}
        modelConfig={modelConfig}
      />,
    );
    expect(screen.getByTestId('content')).toHaveTextContent(mockErrorText);

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toHaveAttribute(
      'data-role',
      'assistant',
    );

    // Trigger the onRendered callback by clicking the content
    screen.getByTestId('content').click();
    expect(mockOnRendered).toHaveBeenCalledTimes(1);
  });
});
