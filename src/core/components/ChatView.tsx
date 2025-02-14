import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './ChatView.module.css';
import { CancelChatIcon, ResetChatIcon, SendChatIcon } from '../assets';
import { useTheme } from '../../shared/theme/useTheme';
import { Conversation } from './Conversation';
import { useAppContext } from '../context/useAppContext';
import { NavBar } from './NavBar';
import type { ChatMessage } from '../stores/messageHistoryStore';
import ModelSelector from './ModelSelector';

export interface ChatViewProps {
  messages: ChatMessage[];
  cautionText: string;
  onSubmit(value: string): void;
  onReset(): void;
  onCancel(): void;
  onMenu(): void;
  onNewChat(): void;
  onPanelOpen(): void;
  isPanelOpen: boolean;
  introText: string;
}

const DEFAULT_HEIGHT = '70px';

export const ChatView = ({
  messages,
  cautionText,
  onSubmit,
  onReset,
  onCancel,
  onMenu,
  onNewChat,
  onPanelOpen,
  isPanelOpen,
  introText,
}: ChatViewProps) => {
  const { isRequesting, modelConfig } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
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
    console.log('content rendered');
    console.log(containerRef.current.scrollHeight);
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    console.log(containerRef.current.scrollTop);
  }, []);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (inputRef.current && inputValue === '') {
      inputRef.current.style.height = DEFAULT_HEIGHT;
      setShouldAutoScroll(true); // Reset scroll state when input is cleared
    }
  }, [inputValue]);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const hasMessages =
    messages.filter((message) => message.role != 'system').length > 0;

  const handleContentRendered = useCallback(() => {
    if (!containerRef.current) return;

    if (shouldAutoScroll) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [shouldAutoScroll, scrollToBottom]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      /**
       * Set the text area height to 'auto' on change so the height is
       * automatically adjusted as the user types. Set it to the
       * scrollHeight so as the user types, the textarea content moves
       * upward keeping the user on the same line
       */
      const textarea = event.target;
      textarea.style.height = DEFAULT_HEIGHT; // Reset to default height first
      textarea.style.height = `min(${textarea.scrollHeight}px, 60vh)`; // Adjust to scrollHeight
      setInputValue(textarea.value);
    },
    [],
  );

  const handleButtonClick = useCallback(() => {
    if (isRequesting) {
      onCancel();
      return;
    }

    if (inputValue === '') {
      return;
    }

    let processedMessage = inputValue;
    if (modelConfig.messageProcessors?.preProcess) {
      processedMessage = modelConfig.messageProcessors.preProcess(inputValue);
    }

    onSubmit(processedMessage);
    setInputValue('');
    setShouldAutoScroll(true); // Reset scroll state when sending new message

    // Reset height after submitting
    if (inputRef.current) {
      inputRef.current.style.height = DEFAULT_HEIGHT;
    }
  }, [isRequesting, inputValue, onSubmit, onCancel, modelConfig]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        return;
      }
      event.preventDefault();

      if (!isRequesting && buttonRef.current) {
        buttonRef.current.click();
      }
    }
  };

  const { colors, logo: Logo } = useTheme();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className={styles.chatview} data-testid="chatview">
      <div ref={containerRef} className={styles.scrollContainer}>
        <div className={styles.chatHeader}>
          <NavBar
            onPanelOpen={onPanelOpen}
            isPanelOpen={isPanelOpen}
            onMenu={onMenu}
            onNewChat={onNewChat}
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
                      width={'100%'}
                      height="auto"
                      className={styles.startLogo}
                    />
                  )}
                </div>
                <h1 className={styles.introText}>{introText}</h1>
              </div>
            )}

            <div className={styles.controls}>
              <div className={styles.inputContainer}>
                <textarea
                  className={styles.input}
                  data-testid="chat-view-input"
                  rows={1}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  ref={inputRef}
                  placeholder="Ask anything..."
                ></textarea>

                <button
                  data-testid="chat-view-button"
                  ref={buttonRef}
                  className={styles.sendChatButton}
                  type="submit"
                  onClick={handleButtonClick}
                  aria-label="Send Chat"
                  disabled={!isRequesting && inputValue.length === 0}
                >
                  {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
                </button>
              </div>

              <span
                className={styles.importantInfo}
                data-testid="importantInfo"
              >
                <p>{cautionText}</p>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
