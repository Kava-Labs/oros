import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ThinkingContent } from './ThinkingContent';

// Mock the useTheme hook
vi.mock('../../../shared/theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      accentTwo: '#FF433E',
    },
  }),
}));

describe('ThinkingContent', () => {
  const mockContent = 'This is thinking content\nWith multiple lines\nOf text';
  const mockOnRendered = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when content is empty', () => {
    const { container } = render(<ThinkingContent content="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the collapsed thinking section by default', () => {
    render(<ThinkingContent content={mockContent} />);

    expect(screen.getByText('Thinking Process')).toBeInTheDocument();
    expect(screen.getByLabelText('thinking')).toBeInTheDocument();

    // Content should be in the DOM but not visible (collapsed)
    const paragraphs = screen.getAllByText(
      /This is thinking content|With multiple lines|Of text/,
    );
    expect(paragraphs).toHaveLength(3);
    paragraphs.forEach((p) => {
      expect(p).toHaveStyle('opacity: 0');
      expect(p).toHaveStyle('transform: translateY(8px)');
    });
  });

  it('expands content when header button is clicked', () => {
    render(<ThinkingContent content={mockContent} />);

    // Click the header to expand
    fireEvent.click(screen.getByText('Thinking Process'));

    // Content should now be visible
    const paragraphs = screen.getAllByText(
      /This is thinking content|With multiple lines|Of text/,
    );
    paragraphs.forEach((p) => {
      expect(p).toHaveStyle('opacity: 1');
      expect(p).toHaveStyle('transform: translateY(0)');
    });

    // Chevron should be rotated
    let chevron = screen.getByLabelText('collapse thinking conent');
    expect(chevron).toHaveStyle('transform: rotate(180deg)');

    // Click again to collapse
    fireEvent.click(screen.getByText('Thinking Process'));

    // Chevron should not be rotated
    chevron = screen.getByLabelText('expand thinking conent');
    expect(chevron).not.toHaveStyle('transform: rotate(180deg)');
  });
});
