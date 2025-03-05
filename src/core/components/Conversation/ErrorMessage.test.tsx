import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorMessage } from './ErrorMessage';

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
  const mockErrorText = 'An error occurred';
  const mockOnRendered = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with KavaIcon and Content components', () => {
    render(
      <ErrorMessage errorText={mockErrorText} onRendered={mockOnRendered} />,
    );
    expect(screen.getByTestId('content')).toHaveTextContent(mockErrorText);

    // should see both the assistant icon and content
    expect(screen.getByLabelText('Kava Assistant Icon')).toBeInTheDocument();
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
