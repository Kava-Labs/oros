import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ButtonIcon from './ButtonIcon';
import { EllipsisVertical } from 'lucide-react';

describe('ButtonIcon', () => {
  it('renders a button with icon and aria-label', () => {
    render(<ButtonIcon icon={EllipsisVertical} aria-label="Chat Options" />);
    const button = screen.getByRole('button', { name: 'Chat Options' });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(
      <ButtonIcon
        icon={EllipsisVertical}
        aria-label="Chat Options"
        onClick={handleClick}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with custom size', () => {
    render(
      <ButtonIcon
        icon={EllipsisVertical}
        size={20}
        aria-label="Chat Options"
      />,
    );

    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders with custom className', () => {
    const customClass = 'menuIcon';
    render(
      <ButtonIcon
        icon={EllipsisVertical}
        className={customClass}
        aria-label="Chat Options"
      />,
    );

    expect(screen.getByRole('button')).toHaveClass(customClass);
  });

  it('renders with tooltip configuration', () => {
    render(
      <ButtonIcon
        icon={EllipsisVertical}
        tooltip={{
          text: 'Chat Options',
          position: 'bottom',
        }}
        aria-label="Chat Options"
      />,
    );

    expect(screen.getByText('Chat Options')).toBeInTheDocument();
  });

  it('applies custom data attributes', () => {
    render(
      <ButtonIcon
        icon={EllipsisVertical}
        data-menu-button="true"
        aria-label="Chat Options"
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute(
      'data-menu-button',
      'true',
    );
  });

  describe('Type safety', () => {
    it('handles undefined tooltip properly', () => {
      const defaultProps = {
        icon: EllipsisVertical,
        'aria-label': 'Settings',
      };

      render(<ButtonIcon {...defaultProps} />);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});
