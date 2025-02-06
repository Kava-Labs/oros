import { useRef, useState, useCallback, useEffect } from 'react';
import styles from './ChatView.module.css';
import { CancelChatIcon, ResetChatIcon, SendChatIcon } from '../assets';
import { useTheme } from '../../shared/theme/useTheme';
import { Conversation } from './Conversation';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { useAppContext } from '../context/useAppContext';
import { isInIframe } from '../utils/isInIframe';
import { useIsMobile } from '../../shared/theme/useIsMobile';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

export interface ChatViewProps {
  messages: ChatCompletionMessageParam[];
  cautionText: string;
  onSubmit(value: string): void;
  onReset(): void;
  onCancel(): void;
  introText: string;
}

export const ChatView = ({
  messages,
  cautionText,
  onSubmit,
  onReset,
  onCancel,
  introText,
}: ChatViewProps) => {
  const { isRequesting, modelConfig } = useAppContext();
  const hasMessages =
    messages.filter((message) => message.role != 'system').length > 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const handleContentRendered = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [containerRef]);

  const [inputValue, setInputValue] = useState('');

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      /**
       * Set the text area height to 'auto' on change so the height is
       * automatically adjusted as the user types. Set it to the
       * scrollHeight so as the user types, the textarea content moves
       * upward keeping the user on the same line
       */
      const textarea = event.target;
      textarea.style.height = 'auto';
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
  }, [isRequesting, inputValue, onSubmit, onCancel, modelConfig]);

  const buttonRef = useRef<HTMLButtonElement>(null);
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

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isIframe = isInIframe();
  const isMobile = useIsMobile();

  const showNavBar = !isIframe && FEAT_UPDATED_DESIGN;

  return (
    <div
      id={showNavBar ? styles.updatedChatView : styles.chatview}
      data-testid="chatview"
    >
      <div
        ref={containerRef}
        id={styles.scrollContent}
        data-testid="scrollContent"
      >
        {hasMessages && (
          <>
            {/* Important: When this goes live, the conditional to render ResetChatIcon will change.
                       We only want to show this trash can in the iframe: !FEAT_UPDATED_DESIGN wil change to  isIframe
             */}
            {!FEAT_UPDATED_DESIGN && (
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
        id={styles.controls}
        data-testid="controls"
        className={hasMessages ? styles.inputNormal : styles.inputRaised}
      >
        <div id={styles.inputContainer}>
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
            {isRequesting ? (
              <CancelChatIcon color={colors.accent} />
            ) : (
              <SendChatIcon />
            )}
          </button>
        </div>
        <span id={styles.importantInfo} data-testid="importantInfo">
          <p>{cautionText}</p>
        </span>
      </div>
    </div>
  );
};
