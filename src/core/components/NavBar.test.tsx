import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NavBar, NavBarProps } from './NavBar';
import { useIsMobileLayout } from 'lib-kava-ai';

import { MessageHistoryStore } from '../stores/messageHistoryStore';

const messageHistoryStore = new MessageHistoryStore();

import * as useIsMobileLayoutModule from 'lib-kava-ai';
import { getModelConfig } from '../config';

vi.mock('lib-kava-ai', async () => {
  const actual =
    await vi.importActual<typeof useIsMobileLayoutModule>('lib-kava-ai');
  return {
    ...actual,
    useIsMobileLayout: vi.fn(), // mock only this one
  };
});

/*
  Mock these components so we're truly unit testing this component
  and don't have to update multiple tests when children change
*/
vi.mock('./ModelSelector', () => ({
  ModelSelector: () => <div data-testid="model-selector">Model Selector</div>,
}));
vi.mock('../assets/NewChatButton', () => ({
  NewChatButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} data-testid="new-chat-button">
      New Chat
    </button>
  ),
}));

describe('NavBar', () => {
  const mockProps: NavBarProps = {
    onMenu: vi.fn(),
    onPanelOpen: vi.fn(),
    isPanelOpen: false,
    showModelSelector: true,
    startNewChat: vi.fn(),
    messageHistoryStore,
    handleModelChange: vi.fn(),
    modelConfig: getModelConfig('o3-mini'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      (
        useIsMobileLayout as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue(false);
    });

    it('renders desktop controls when not mobile', () => {
      render(<NavBar {...mockProps} />);

      expect(
        screen.getByRole('button', { name: 'Open Menu' }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('new-chat-button')).toBeInTheDocument();
      expect(screen.getByTestId('model-selector')).toBeInTheDocument();
    });

    it('hides panel open button when panel is open', () => {
      render(<NavBar {...mockProps} isPanelOpen={true} />);

      expect(
        screen.queryByRole('button', { name: 'Open Menu' }),
      ).not.toBeInTheDocument();
    });

    it('calls onPanelOpen when panel button is clicked', () => {
      render(<NavBar {...mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
      expect(mockProps.onPanelOpen).toHaveBeenCalledTimes(1);
    });

    it('calls onNewChat when new chat button is clicked', () => {
      render(<NavBar {...mockProps} />);

      fireEvent.click(screen.getByTestId('new-chat-button'));
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      (
        useIsMobileLayout as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);
    });

    it('renders mobile layout with menu button', () => {
      render(<NavBar {...mockProps} />);

      expect(
        screen.getByRole('button', { name: 'Toggle Menu' }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('model-selector')).toBeInTheDocument();
      expect(screen.getByTestId('new-chat-button')).toBeInTheDocument();
    });

    it('calls onMenu when menu button is clicked', () => {
      render(<NavBar {...mockProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Menu' }));
      expect(mockProps.onMenu).toHaveBeenCalledTimes(1);
    });
  });
});
