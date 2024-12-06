import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResetButton } from './ResetButton';

describe('ResetButton Component', () => {
  const clearMessages = vi.fn();

  it('button calls clearMessages onClick', () => {
    render(<ResetButton clearMessages={clearMessages} />);

    const resetButtonElement = screen.getByText('Reset Chat');
    expect(resetButtonElement).toBeInTheDocument();
    expect(clearMessages).not.toHaveBeenCalled();

    fireEvent.click(resetButtonElement);
    expect(clearMessages).toHaveBeenCalledTimes(1);
  });
});
