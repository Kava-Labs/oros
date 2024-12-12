import { useRef, useState } from 'react';
import styles from './ChatView.module.css';
import chatIcon from './assets/chatIcon.svg';

import type { ChatCompletionMessageParam } from 'openai';

export interface ChatViewProps {
  messages: ChatCompletionMessageParam[];
}

export const ChatView = ({ messages }: ChatViewProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: any) => {
    /**
     * Set the text area height to 'auto' on change so the height is
     * automatically adjusted as the user types. Set it to the
     * scrollHeight so as the user types, the textarea content moves
     * upward keeping the  user on the same line
     */
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `min(${textarea.scrollHeight}px, 60vh)`; // Adjust to scrollHeight
    setInputValue(textarea.value);
  };

  const handleButtonClick = () => {
    console.log(inputValue);
  };

  const hasMessages = messages && messages.length > 0;

  return (
    <div id={styles.chatview} data-testid="chatview">
      <div id={styles.content} data-testid="content">
        <div id={styles.conversation} data-testid="conversation">
          {hasMessages &&
            messages.map((message, index) => {
              return (
                <div
                  key={index}
                  className={
                    message.role == 'assistant' ? styles.left : styles.right
                  }
                >
                  {message.role == 'assistant' && (
                    <img src={chatIcon} className={styles.chatIcon} />
                  )}
                  <p>{message.content}</p>
                </div>
              );
            })}

          {!hasMessages && (
            <div id={styles.start} data-testid="start">
              <img src={chatIcon} />
              <h1>Let's get started!</h1>
              <p>
                Tell me about your memecoin idea below and we'll generate
                everything you need to get it launched.
              </p>
            </div>
          )}
        </div>
      </div>

      <div id={styles.controls} data-testid="controls">
        <div id={styles.inputContainer}>
          <textarea
            id={styles.input}
            data-testid="input"
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
          ></textarea>

          <button
            id={styles.sendChatButton}
            type="submit"
            onClick={handleButtonClick}
            aria-label="Send Chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              color={'#FFFFFF'}
              fill={'none'}
            >
              <path
                d="M12 4V20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 12H20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <span id={styles.importantInfo} data-testid="importantInfo">
          <p>This application may produce errors and incorrect information.</p>
        </span>
      </div>
    </div>
  );
};
