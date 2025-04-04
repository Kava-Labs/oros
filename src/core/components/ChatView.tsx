import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './ChatView.module.css';
import { Conversation } from './Conversation/Conversation';
import { NavBar } from './NavBar';
import { useMessageHistory } from '../hooks/useMessageHistory';
import ChatInput from './ChatInput';
import { LandingContent } from './LandingContent';
import { defaultCautionText } from '../config/models/defaultPrompts';
import { ModelConfig } from '../types/models';

export interface ChatViewProps {
  onMenu(): void;
  onPanelOpen(): void;
  isPanelOpen: boolean;
  supportsUpload: boolean;
  showModelSelector: boolean;
  startNewChat: () => void;
  conversationID: string;
  modelConfig: ModelConfig;
}

export const ChatView = ({
  onMenu,
  onPanelOpen,
  isPanelOpen,
  supportsUpload,
  showModelSelector,
  startNewChat,
  conversationID,
  modelConfig,
}: ChatViewProps) => {
  const { hasMessages } = useMessageHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  // Track if we should auto-scroll
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

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

  return (
    <div className={styles.chatview} data-testid="chatview">
      <div ref={containerRef} className={styles.scrollContainer}>
        <div className={styles.chatHeader}>
          <NavBar
            onPanelOpen={onPanelOpen}
            isPanelOpen={isPanelOpen}
            onMenu={onMenu}
            showModelSelector={showModelSelector}
            startNewChat={startNewChat}
          />
        </div>

        <div className={styles.chatContainer}>
          <div
            className={`${styles.chatContent} ${hasMessages ? styles.fullHeight : ''}`}
          >
            {hasMessages && (
              <Conversation
                onRendered={handleContentRendered}
                modelConfig={modelConfig}
              />
            )}
          </div>

          <div
            className={`${styles.controlsContainer} ${hasMessages ? styles.positionSticky : ''}`}
            data-testid="controls"
          >
            {!hasMessages && (
              <LandingContent introText={modelConfig.introText} />
            )}

            <ChatInput
              setShouldAutoScroll={setShouldAutoScroll}
              supportsUpload={supportsUpload}
              startNewChat={startNewChat}
              conversationID={conversationID}
              modelConfig={modelConfig}
            />
            <div className={styles.importantInfo}>
              <span>{defaultCautionText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
