import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NavBar, NavBarProps } from './NavBar';
import { useIsMobileLayout } from '../../shared/theme/useIsMobileLayout';
import { AppContextProvider } from '../context/AppContextProvider';
import { TextStreamStore } from 'lib-kava-ai';
import { MessageHistoryStore } from '../stores/messageHistoryStore';

const messageStore = new TextStreamStore();
const progressStore = new TextStreamStore();
const messageHistoryStore = new MessageHistoryStore();
const thinkingStore = new TextStreamStore();
const errorStore = new TextStreamStore();

vi.mock('../../shared/theme/useIsMobileLayout');

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
      render(
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <NavBar {...mockProps} />
        </AppContextProvider>,
      );

      expect(
        screen.getByRole('button', { name: 'Open Menu' }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('new-chat-button')).toBeInTheDocument();
      expect(screen.getByTestId('model-selector')).toBeInTheDocument();
    });

    it('hides panel open button when panel is open', () => {
      render(
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <NavBar {...mockProps} isPanelOpen={true} />
        </AppContextProvider>,
      );

      expect(
        screen.queryByRole('button', { name: 'Open Menu' }),
      ).not.toBeInTheDocument();
    });

    it('calls onPanelOpen when panel button is clicked', () => {
      render(
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <NavBar {...mockProps} />
        </AppContextProvider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
      expect(mockProps.onPanelOpen).toHaveBeenCalledTimes(1);
    });

    it('calls onNewChat when new chat button is clicked', () => {
      render(
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <NavBar {...mockProps} />
        </AppContextProvider>,
      );

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
      render(
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <NavBar {...mockProps} />
        </AppContextProvider>,
      );

      expect(
        screen.getByRole('button', { name: 'Toggle Menu' }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('model-selector')).toBeInTheDocument();
      expect(screen.getByTestId('new-chat-button')).toBeInTheDocument();
    });

    it('calls onMenu when menu button is clicked', () => {
      render(
        <AppContextProvider
          errorStore={errorStore}
          thinkingStore={thinkingStore}
          progressStore={progressStore}
          messageStore={messageStore}
          messageHistoryStore={messageHistoryStore}
        >
          <NavBar {...mockProps} />
        </AppContextProvider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Menu' }));
      expect(mockProps.onMenu).toHaveBeenCalledTimes(1);
    });
  });
});
