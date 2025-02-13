import { render, screen, fireEvent, within } from '@testing-library/react';
import { ModelSelector } from './ModelSelector';
import { useAppContext } from '../context/useAppContext';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { getAllModels } from '../config/models';
import { vi } from 'vitest';

// Mock the required modules and hooks
vi.mock('../context/useAppContext');
vi.mock('../../shared/theme/useIsMobile');
vi.mock('../config/models');

// Mock icons
const KavaIcon = () => <div data-testid="kava-icon">KavaIcon</div>;
const OrosIcon = () => <div data-testid="oros-icon">OrosIcon</div>;

// Create mock model configurations
const mockReasoningModel = {
  id: 'deepseek-r1',
  name: 'General Reasoning',
  icon: KavaIcon,
  description: 'Logical Analysis',
  tools: [],
  systemPrompt: 'default system prompt',
  introText: 'default intro text',
  inputPlaceholderText: 'default placeholder',
};

const mockBlockchainModel = {
  id: 'gpt-4o',
  name: 'Blockchain Instruct',
  icon: OrosIcon,
  description: 'Blockchain Execution',
  tools: [],
  systemPrompt: 'blockchain system prompt',
  introText: 'blockchain intro text',
  inputPlaceholderText: 'blockchain placeholder',
};

describe('ModelSelector', () => {
  const mockHandleModelChange = vi.fn();
  const mockGetSnapshot = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      modelConfig: mockReasoningModel,
      messageHistoryStore: {
        getSnapshot: mockGetSnapshot,
      },
      handleModelChange: mockHandleModelChange,
    });
    (getAllModels as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      mockReasoningModel,
      mockBlockchainModel,
    ]);
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    mockGetSnapshot.mockReturnValue([]);
  });

  it('renders with initial closed state', () => {
    render(<ModelSelector />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', () => {
    render(<ModelSelector />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('displays all model options with correct content', () => {
    render(<ModelSelector />);

    fireEvent.click(screen.getByRole('button'));
    // scope within the listbox so we don't get the selected model returned too
    const dropdownMenu = screen.getByRole('listbox');

    // Check reasoning model content
    expect(within(dropdownMenu).getAllByText('General Reasoning')).toHaveLength(
      1,
    );
    expect(within(dropdownMenu).getAllByText('Logical Analysis')).toHaveLength(
      1,
    );
    expect(within(dropdownMenu).getAllByTestId('kava-icon')).toHaveLength(1);

    // Check blockchain model content
    expect(
      within(dropdownMenu).getAllByText('Blockchain Instruct'),
    ).toHaveLength(1);
    expect(
      within(dropdownMenu).getAllByText('Blockchain Execution'),
    ).toHaveLength(1);
    expect(within(dropdownMenu).getAllByTestId('oros-icon')).toHaveLength(1);
  });

  it('selects a model when clicked', () => {
    render(<ModelSelector />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Blockchain Instruct'));

    expect(mockHandleModelChange).toHaveBeenCalledWith('gpt-4o');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(<ModelSelector />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('disables selector when chat has messages', () => {
    mockGetSnapshot.mockReturnValue([
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi' },
    ]);

    render(<ModelSelector />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows tooltip with correct positioning when disabled', async () => {
    mockGetSnapshot.mockReturnValue([
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi' },
    ]);

    // Test mobile view
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const { rerender } = render(<ModelSelector />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    // Hover over the button to show tooltip
    fireEvent.mouseEnter(button);

    // Now look for the tooltip text
    const tooltipText = await screen.findByText(
      'Model switching is disabled once a chat has started',
    );
    expect(tooltipText).toBeInTheDocument();

    // Test desktop view similarly
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    rerender(<ModelSelector />);

    // Hover over the button again after rerender
    fireEvent.mouseEnter(button);

    const desktopTooltipText = await screen.findByText(
      'Model switching is disabled once a chat has started',
    );
    expect(desktopTooltipText).toBeInTheDocument();
  });

  it('marks current model as selected', () => {
    render(<ModelSelector />);

    fireEvent.click(screen.getByRole('button'));

    const options = screen.getAllByRole('option');
    const reasoningOption = options.find((option) =>
      within(option).queryByText('General Reasoning'),
    );

    expect(reasoningOption).toHaveAttribute('aria-selected', 'true');
  });

  it('displays correct icon for selected model', () => {
    // Test with reasoning model
    render(<ModelSelector />);
    expect(screen.getByTestId('kava-icon')).toBeInTheDocument();

    // Test with blockchain model
    (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      modelConfig: mockBlockchainModel,
      messageHistoryStore: {
        getSnapshot: mockGetSnapshot,
      },
      handleModelChange: mockHandleModelChange,
    });

    render(<ModelSelector />);
    expect(screen.getByTestId('oros-icon')).toBeInTheDocument();
  });
});
