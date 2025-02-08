import { render, screen, fireEvent } from '@testing-library/react';
import ModelDropdownExpanded from './ModelDropdownExpanded';
import { useAppContext } from '../context/useAppContext';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import {
  getAllModels,
  isBlockchainModelName,
  MODEL_REGISTRY,
} from '../config/models';
import { vi } from 'vitest';

// Mock the required modules and hooks
vi.mock('../context/useAppContext');
vi.mock('../../shared/theme/useIsMobile');
vi.mock('../config/models');

// Create mock models for testing
const mockModels = [
  ...Object.values(MODEL_REGISTRY.blockchain),
  ...Object.values(MODEL_REGISTRY.reasoning),
];

describe('ModelDropdownExpanded', () => {
  const mockHandleModelChange = vi.fn();
  const mockSetDropdownOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      handleModelChange: mockHandleModelChange,
    });
    (getAllModels as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockModels,
    );
    (
      isBlockchainModelName as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((id: string) => id === 'gpt-4o');
  });

  it('renders all model options', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<ModelDropdownExpanded setDropdownOpen={mockSetDropdownOpen} />);

    expect(screen.getByTestId('model-dropdown-menu')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Instruct')).toBeInTheDocument();
    expect(screen.getByText('General Reasoning')).toBeInTheDocument();
  });

  it('calls handleModelChange and setDropdownOpen when a model is selected', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<ModelDropdownExpanded setDropdownOpen={mockSetDropdownOpen} />);

    fireEvent.click(screen.getByText('Blockchain Instruct'));

    expect(mockHandleModelChange).toHaveBeenCalledWith('gpt-4o');
    expect(mockSetDropdownOpen).toHaveBeenCalledWith(false);
  });

  it('disables blockchain models on mobile', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<ModelDropdownExpanded setDropdownOpen={mockSetDropdownOpen} />);

    const regularModelButton = screen
      .getByText('General Reasoning')
      .closest('button');
    const blockchainModelButton = screen
      .getByText('Blockchain Instruct')
      .closest('button');

    expect(regularModelButton).not.toBeDisabled();
    expect(blockchainModelButton).toBeDisabled();
  });

  it('enables all models on desktop', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<ModelDropdownExpanded setDropdownOpen={mockSetDropdownOpen} />);

    const buttons = screen.getAllByRole('option');
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });
});
