import styles from './ChatView.module.css';
import chatIcon from './assets/chatIcon.svg';

import type { ChatCompletionMessageParam } from 'openai';

export interface ChatViewProps {
  messages: ChatCompletionMessageParam[];
}

export const ChatView = ({ messages }: ChatViewProps) => {
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
        <div id={styles.input} data-testid="input"></div>
        <span id={styles.importantInfo} data-testid="importantInfo">
          <p>This application may produce errors and incorrect information.</p>
        </span>
      </div>
    </div>
  );
};
