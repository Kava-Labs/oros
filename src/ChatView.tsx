import { useRef, useState, useCallback } from 'react';
import styles from './ChatView.module.css';
import { ResetChatIcon } from './assets/ResetChatIcon';
import { SendChatIcon } from './assets/SendChatIcon';
import { CancelChatIcon } from './assets/CancelChatIcon';
import { useTheme } from './theme/themeContext';
import { Conversation } from './Conversation';

import type { ChatCompletionMessageParam } from 'openai/resources/index';

export interface ChatViewProps {
  messages: ChatCompletionMessageParam[];
  errorText: string;
  isRequesting: boolean;
  onSubmit(value: string): void;
  onReset(): void;
  onCancel(): void;

  introText: string;
  address: string;
  chainID: string;
}

export const ChatView = ({
  messages,
  errorText,
  isRequesting,
  onSubmit,
  onReset,
  onCancel,

  introText,
  address,
  chainID,
}: ChatViewProps) => {
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

    if (inputValue == '') {
      return;
    }

    onSubmit(inputValue);
    setInputValue('');
  }, [isRequesting, onSubmit, onCancel, inputValue]);

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

  const { theme } = useTheme();

  return (
    <div id={styles.chatview} data-testid="chatview">
      <div
        ref={containerRef}
        id={styles.scrollContent}
        data-testid="scrollContent"
      >
        {hasMessages && (
          <>
            <div id={styles.stickyHeader}>
              <button
                id={styles.resetButton}
                aria-label="Reset Chat"
                onClick={onReset}
              >
                <ResetChatIcon color={theme.colors.accentTransparent} />
              </button>
            </div>

            <Conversation
              messages={messages}
              errorText={errorText}
              isRequesting={isRequesting}
              onRendered={handleContentRendered}
            />
          </>
        )}

        {!hasMessages && (
          <div id={styles.startContainer}>
            <div id={styles.start} data-testid="start">
              <img src={theme.logo} id={styles.chatIconContainer} />
              <h3>Let's get started!</h3>
              <h6>
                {address
                  ? `your wallet address: ${address} connected to chainID: ${chainID.startsWith('0x') ? parseInt(chainID, 16) : chainID}`
                  : introText}
              </h6>
            </div>
          </div>
        )}
      </div>

      <div id={styles.controls} data-testid="controls">
        <div id={styles.inputContainer}>
          <textarea
            id={styles.input}
            data-testid="chat-view-input"
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
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
              <CancelChatIcon color={theme.colors.accentTransparent} />
            ) : (
              <SendChatIcon color={theme.colors.accentTransparent} />
            )}
          </button>
        </div>
        <span id={styles.importantInfo} data-testid="importantInfo">
          <p>This application may produce errors and incorrect information.</p>
        </span>
      </div>
    </div>
  );
};
