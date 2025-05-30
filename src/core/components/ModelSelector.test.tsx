import { render, screen, fireEvent, within } from '@testing-library/react';
import { ModelSelector } from './ModelSelector';
import { useIsMobileLayout } from 'lib-kava-ai';
import { getAllModels } from '../config/models/index';
import { vi } from 'vitest';
import { ModelConfig } from '../types/models';

// Mock the required modules and hooks
vi.mock('../context/useAppContext');
vi.mock('lib-kava-ai');
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

  beforeEach(() => {
    vi.clearAllMocks();

    (getAllModels as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      mockReasoningModel,
      mockBlockchainModel,
    ]);
    (useIsMobileLayout as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      false,
    );
  });

  it('renders with initial closed state', () => {
    render(
      <ModelSelector
        handleModelChange={vi.fn()}
        modelConfig={mockReasoningModel as unknown as ModelConfig}
        isDisabled={false}
      />,
    );

    const combobox = screen.getByRole('combobox', { name: 'Select Model' });
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', () => {
    render(
      <ModelSelector
        handleModelChange={vi.fn()}
        modelConfig={mockReasoningModel as unknown as ModelConfig}
        isDisabled={false}
      />,
    );

    const combobox = screen.getByRole('combobox', { name: 'Select Model' });
    fireEvent.click(combobox);

    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('displays all model options with correct content', () => {
    render(
      <ModelSelector
        handleModelChange={vi.fn()}
        modelConfig={getAllModels()[0]}
        isDisabled={false}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Select Model' }));
    const dropdownMenu = screen.getByRole('listbox');

    // Check reasoning model content
    expect(
      within(dropdownMenu).getByText('General Reasoning'),
    ).toBeInTheDocument();
    expect(
      within(dropdownMenu).getByText('Logical Analysis'),
    ).toBeInTheDocument();
    expect(within(dropdownMenu).getByTestId('kava-icon')).toBeInTheDocument();

    // Check blockchain model content
    expect(
      within(dropdownMenu).queryByText('Blockchain Instruct'),
    ).toBeInTheDocument();
    expect(
      within(dropdownMenu).queryByText('Blockchain Execution'),
    ).toBeInTheDocument();
    expect(within(dropdownMenu).queryByTestId('oros-icon')).toBeInTheDocument();
  });

  it('selects a model when clicked', () => {
    render(
      <ModelSelector
        handleModelChange={mockHandleModelChange}
        modelConfig={getAllModels()[0]}
        isDisabled={false}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Select Model' }));
    fireEvent.click(screen.getAllByText('General Reasoning')[1]);

    expect(mockHandleModelChange).toHaveBeenCalledWith('deepseek-r1');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <ModelSelector
        handleModelChange={vi.fn()}
        modelConfig={getAllModels()[0]}
        isDisabled={false}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Select Model' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks current model as selected', () => {
    render(
      <ModelSelector
        handleModelChange={vi.fn()}
        modelConfig={getAllModels()[0]}
        isDisabled={false}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Select Model' }));

    const options = screen.getAllByRole('option');
    const reasoningOption = options.find((option) =>
      within(option).queryByText('General Reasoning'),
    );

    expect(reasoningOption).toHaveAttribute('aria-selected', 'true');
  });

  it('supports keyboard navigation with arrow keys', async () => {
    render(
      <ModelSelector
        handleModelChange={mockHandleModelChange}
        modelConfig={mockBlockchainModel as unknown as ModelConfig}
        isDisabled={false}
      />,
    );

    // Open the dropdown
    const combobox = screen.getByRole('combobox', { name: 'Select Model' });
    fireEvent.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    // Wait for dropdown to render
    await screen.findByRole('listbox');

    // Get all options
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);

    // Move selection to first option
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });

    // Wait for React state update
    const blockchainOption = screen.queryByRole('option', {
      name: 'Blockchain Instruct',
    });

    expect(blockchainOption).toBeInTheDocument();

    // Move selection to second option
    fireEvent.keyDown(options[0], { key: 'ArrowDown' });

    // Wait for second option to be selected
    const generalReasoningOption = await screen.findByRole('option', {
      name: 'General Reasoning',
    });

    expect(generalReasoningOption).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(generalReasoningOption);

    // // Press Enter to select the model
    fireEvent.keyDown(generalReasoningOption, { key: 'Enter' });

    // Ensure correct model was selected
    expect(mockHandleModelChange).toHaveBeenCalledWith('deepseek-r1');
  });

  it('displays correct icon for selected model', () => {
    // Test with reasoning model
    render(
      <ModelSelector
        handleModelChange={vi.fn()}
        modelConfig={mockReasoningModel as unknown as ModelConfig}
        isDisabled={false}
      />,
    );
    expect(screen.getByTestId('kava-icon')).toBeInTheDocument();

    render(
      <ModelSelector
        handleModelChange={vi.fn()}
        modelConfig={mockBlockchainModel as unknown as ModelConfig}
        isDisabled={false}
      />,
    );
    expect(screen.getByTestId('oros-icon')).toBeInTheDocument();
  });
});
