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
  const [isDragging, setIsDragging] = useState(false);

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

  // Handle drag and drop events
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();

      // Check if the dragged item is a file
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      // Keep the dragging state active
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();

      // Check if leaving the window or moving to a child element
      // We only want to handle actual leaving events, not when moving between elements
      if (
        e.relatedTarget === null ||
        !containerRef.current?.contains(e.relatedTarget as Node)
      ) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      // Always reset the dragging state on drop
      setIsDragging(false);
    };

    // Add event listeners to document
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      // Clean up
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

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
              {/* Drag and Drop Preview Element - Show ABOVE input when messages exist */}
              {isDragging && hasMessages && (
                <div className={`${styles.dropPreview} ${styles.previewAbove}`}>
                  <span>Drop your image to upload</span>
                </div>
              )}

              <ChatInput setShouldAutoScroll={setShouldAutoScroll} />

              {/* Drag and Drop Preview Element - Show BELOW input when no messages */}
              {isDragging && !hasMessages && (
                <div className={`${styles.dropPreview} ${styles.previewBelow}`}>
                  <span>Drop your image to upload</span>
                </div>
              )}
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
