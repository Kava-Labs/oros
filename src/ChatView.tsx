import { useRef, useState, useCallback } from 'react';
import styles from './ChatView.module.css';
import { ResetChatIcon } from './assets/ResetChatIcon';
import { SendChatIcon } from './assets/SendChatIcon';
import { CancelChatIcon } from './assets/CancelChatIcon';
import hardDotFunDiamond from './assets/hardDotFunDiamond.svg';
import { Conversation } from './Conversation';

import type { ChatCompletionMessageParam } from 'openai/resources/index';

export interface ChatViewProps {
  messages: ChatCompletionMessageParam[];

  isRequesting: boolean;

  onSubmit(value: string): void;
  onReset(): void;
  onCancel(): void;
}

export const ChatView = ({
  messages,
  isRequesting,
  onSubmit,
  onReset,
  onCancel,
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
    [setInputValue],
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
  }, [isRequesting, onSubmit, onCancel, inputValue, setInputValue]);

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
                <ResetChatIcon />
              </button>
            </div>

            <Conversation
              messages={messages}
              isRequesting={isRequesting}
              onRendered={handleContentRendered}
            />
          </>
        )}

        {!hasMessages && (
          <div id={styles.startContainer}>
            <div id={styles.start} data-testid="start">
              <div id={styles.chatIconContainer}>
                <img src={hardDotFunDiamond} />
              </div>
              <h1>Let's get started!</h1>
              <p>
                Tell me about your memecoin idea below and we'll generate
                everything you need to get it launched.
              </p>
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
            {isRequesting ? <CancelChatIcon /> : <SendChatIcon />}
          </button>
        </div>
        <span id={styles.importantInfo} data-testid="importantInfo">
          <p>This application may produce errors and incorrect information.</p>
        </span>
      </div>
    </div>
  );
};
