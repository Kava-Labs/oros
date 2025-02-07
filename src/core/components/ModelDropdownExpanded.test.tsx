import { render, screen, fireEvent } from '@testing-library/react';
import ModelDropdownExpanded from './ModelDropdownExpanded';
import { useAppContext } from '../context/useAppContext';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { getAllModels, isBlockchainModelName } from '../config/models';
import { vi } from 'vitest';

// Mock the required modules and hooks
vi.mock('../context/useAppContext');
vi.mock('../../shared/theme/useIsMobile');
vi.mock('../config/models');

// Create mock models for testing
const mockModels = [
  {
    id: 'model1',
    name: 'Model 1',
    icon: () => <div data-testid="icon-1">Icon1</div>,
  },
  {
    id: 'blockchain-model',
    name: 'Blockchain Model',
    icon: () => <div data-testid="icon-2">Icon2</div>,
  },
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
    ).mockImplementation((id: string) => id === 'blockchain-model');
  });

  it('renders all model options', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<ModelDropdownExpanded setDropdownOpen={mockSetDropdownOpen} />);

    expect(screen.getByTestId('model-dropdown-menu')).toBeInTheDocument();
    expect(screen.getByText('Model 1')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Model')).toBeInTheDocument();
    expect(screen.getByTestId('icon-1')).toBeInTheDocument();
    expect(screen.getByTestId('icon-2')).toBeInTheDocument();
  });

  it('calls handleModelChange and setDropdownOpen when a model is selected', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    render(<ModelDropdownExpanded setDropdownOpen={mockSetDropdownOpen} />);

    fireEvent.click(screen.getByText('Model 1'));

    expect(mockHandleModelChange).toHaveBeenCalledWith('model1');
    expect(mockSetDropdownOpen).toHaveBeenCalledWith(false);
  });

  it('disables blockchain models on mobile', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<ModelDropdownExpanded setDropdownOpen={mockSetDropdownOpen} />);

    const regularModelButton = screen.getByText('Model 1').closest('button');
    const blockchainModelButton = screen
      .getByText('Blockchain Model')
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
