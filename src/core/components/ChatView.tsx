import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './ChatView.module.css';
import { useTheme } from '../../shared/theme/useTheme';
import { Conversation } from './Conversation';
import { NavBar } from './NavBar';
import type { ChatMessage } from '../stores/messageHistoryStore';
import { useMessageHistory } from '../hooks/useMessageHistory';
import ChatInput from './ChatInput';

export interface ChatViewProps {
  messages: ChatMessage[];
  cautionText: string;
  onMenu(): void;
  onPanelOpen(): void;
  isPanelOpen: boolean;
  introText: string;
}

export const ChatView = ({
  messages,
  cautionText,
  onMenu,
  onPanelOpen,
  isPanelOpen,
  introText,
}: ChatViewProps) => {
  const { hasMessages } = useMessageHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  const [, setDragState] = useState({
    isDragging: false,
    isValidFile: true,
    errorMessage: '',
  });

  // Track if we should auto-scroll
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle drag state from child components
  const handleDragState = (
    isDragging: boolean,
    isValidFile = true,
    errorMessage = '',
  ) => {
    setDragState({ isDragging, isValidFile, errorMessage });
  };

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;

    // Only update auto-scroll if we're not at the bottom, like if the user scrolls up in the chat
    if (!isAtBottom) {
      setShouldAutoScroll(false);
    } else {
      setShouldAutoScroll(true);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleContentRendered = useCallback(() => {
    if (!containerRef.current) return;

    if (shouldAutoScroll) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [shouldAutoScroll, scrollToBottom]);

  const { logo: Logo } = useTheme();

  return (
    <div className={styles.chatview} data-testid="chatview">
      <div ref={containerRef} className={styles.scrollContainer}>
        <div className={styles.chatHeader}>
          <NavBar
            onPanelOpen={onPanelOpen}
            isPanelOpen={isPanelOpen}
            onMenu={onMenu}
          />
        </div>

        <div className={styles.chatContainer}>
          <div
            className={`${styles.chatContent} ${hasMessages ? styles.fullHeight : ''}`}
          >
            {hasMessages && (
              <Conversation
                messages={messages}
                onRendered={handleContentRendered}
              />
            )}
          </div>

          <div
            className={`${styles.controlsContainer} ${hasMessages ? styles.positionSticky : ''}`}
            data-testid="controls"
          >
            {!hasMessages && (
              <div className={styles.startContent}>
                <div className={styles.startLogoContainer}>
                  {Logo && (
                    <Logo
                      width="100%"
                      height="auto"
                      className={styles.startLogo}
                    />
                  )}
                </div>
                <h1 className={styles.introText}>{introText}</h1>
              </div>
            )}

            <div className={styles.inputWrapper}>
              <ChatInput
                setShouldAutoScroll={setShouldAutoScroll}
                handleDragState={handleDragState}
              />
            </div>

            <div className={styles.importantInfo}>
              <span>{cautionText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
