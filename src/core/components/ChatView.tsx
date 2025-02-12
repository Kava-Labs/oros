import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './ChatView.module.css';
import { CancelChatIcon, ResetChatIcon, SendChatIcon } from '../assets';
import { useTheme } from '../../shared/theme/useTheme';
import { Conversation } from './Conversation';
import { useAppContext } from '../context/useAppContext';
import { isInIframe } from '../utils/isInIframe';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { NavBar } from './NavBar';
import type { ChatMessage } from '../stores/messageHistoryStore';
import ModelSelector from './ModelSelector';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

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
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
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

  const isIframe = isInIframe();
  const isMobile = useIsMobile();

  const showNavBar = !isIframe && FEAT_UPDATED_DESIGN;

  return (
    <div className={styles.chatview} data-testid="chatview">
      <div className={styles.chatHeader}>
        <NavBar onPanelOpen={onPanelOpen} isPanelOpen={isPanelOpen} onMenu={onMenu} onNewChat={onNewChat} />
      </div>

        <div ref={containerRef} className={`${styles.scrollArea} ${hasMessages ? styles.expand : ''}`}>
          <div className={styles.scrollContent}>

          { hasMessages && (
              <Conversation
                messages={messages}
                onRendered={handleContentRendered}
              />
          )}
          </div>
        </div>

          <div className={`${styles.controlsContainer} ${hasMessages ? styles.hasMessages : ''}` } data-testid="controls">
            { !hasMessages &&
              <div className={styles.startContent}>
                {Logo && <Logo width={isMobile ? 210 : 292} />}
                <h5 className={styles.introText}>{introText}</h5>
              </div>
            }

            <div className={styles.controls}>
              <div className={styles.inputContainer}>
                <textarea
                  id={styles.input}
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
                  id={styles.sendChatButton}
                  type="submit"
                  onClick={handleButtonClick}
                  aria-label="Send Chat"
                >
                  {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
                </button>
              </div>

              <span id={styles.importantInfo} data-testid="importantInfo">
                <p>{cautionText}</p>
              </span>
        </div>
      </div>
    </div>
  );

  /*return (
    <div
      className={styles.chatView}
      data-testid="chatview"
    >
      {!isMobile && (
        <div className={styles.modelSelectorContainer}>
          <ModelSelector />
        </div>
      )}
      <div
        ref={containerRef}
        id={styles.scrollContent}
        data-testid="scrollContent"
      >
        {hasMessages && (
          <>
            {isIframe && (
              <div id={styles.stickyHeader}>
                <button
                  id={styles.resetButton}
                  aria-label="Reset Chat"
                  onClick={onReset}
                >
                  <ResetChatIcon color={colors.accentTransparent} />
                </button>
              </div>
            )}

            <Conversation
              messages={messages}
              onRendered={handleContentRendered}
            />
          </>
        )}

        {!hasMessages && (
          <div id={styles.startContainer}>
            <div id={styles.start} data-testid="start">
              {Logo && <Logo width={isMobile ? 210 : 292} />}
              <h5 className={styles.introText}>{introText}</h5>
            </div>
          </div>
        )}
      </div>

      <div
        data-testid="controls"
        className={hasMessages ? styles.inputNormal : styles.inputRaised}
      >
      </div>
    </div>
  );
  */
};
