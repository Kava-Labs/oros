import { render, screen, fireEvent } from '@testing-library/react';
import Tooltip from './Tooltip';

describe('Tooltip', () => {
  it('renders children by default without tooltip', () => {
    render(
      <Tooltip content="Tooltip text" topMargin="10">
        <button>Hover me</button>
      </Tooltip>,
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on hover', () => {
    render(
      <Tooltip content="Tooltip text" topMargin="10">
        <button>Hover me</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText('Hover me'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip text');
  });

  it('hides tooltip when mouse leaves', () => {
    render(
      <Tooltip content="Tooltip text" topMargin="10">
        <button>Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
