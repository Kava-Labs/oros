import { memo } from 'react';
import styles from './ChatView.module.css';
import hardDotFunDiamond from './assets/hardDotFunDiamond.svg';
import { Content } from './Content';
import { StreamingText } from './StreamingText';
import { messageStore, progressStore } from './store';
import type { GenerateTokenMetadataResponse } from './tools/toolFunctions';
import { TokenCard } from './TokenCard';

import type { ChatCompletionMessageParam } from 'openai/resources/index';

const ContentMemo = memo(Content, (prevProps, curProps) => {
  // todo: do we need this callback function?
  return (
    prevProps.content === curProps.content &&
    prevProps.onRendered === curProps.onRendered &&
    prevProps.role === curProps.role
  );
});

export interface ConversationProps {
  messages: ChatCompletionMessageParam[];
  errorText: string;
  isRequesting: boolean;

  onRendered(): void;
}

export const Conversation = ({
  messages,
  errorText,
  isRequesting,
  onRendered,
}: ConversationProps) => {
  return (
    <div id={styles.conversation} data-testid="conversation">
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return (
            <div key={index} className={styles.right}>
              <ContentMemo
                role={message.role}
                content={message.content as string}
                onRendered={onRendered}
              />
            </div>
          );
        }

        if (message.role === 'assistant' && message.content) {
          return (
            <div key={index} className={styles.left}>
              <img
                src={hardDotFunDiamond}
                className={styles.conversationChatIcon}
              />
              <div className={styles.assistantContainer}>
                <ContentMemo
                  role={message.role}
                  content={message.content as string}
                  onRendered={onRendered}
                />
              </div>
            </div>
          );
        }

        if (message.role === 'tool') {
          const id = message.tool_call_id;
          const prevMsg = messages[index - 1];

          if (
            !(
              prevMsg.role === 'assistant' &&
              prevMsg.content === null &&
              Array.isArray(prevMsg.tool_calls)
            )
          ) {
            return null;
          }

          const tc = prevMsg.tool_calls.find((tc) => tc.id === id);
          if (!tc) return null;
          if (tc.function.name !== 'generateCoinMetadata') return null;

          const toolResponse: GenerateTokenMetadataResponse = JSON.parse(
            message.content as string,
          );

          return (
            <div key={index} className={styles.left}>
              <TokenCard
                key={index}
                id={toolResponse.id}
                about={toolResponse.about}
                symbol={toolResponse.symbol}
                name={toolResponse.name}
                onRendered={onRendered}
              />
            </div>
          );
        }

        return null;
      })}
      {isRequesting && (
        <div className={styles.left}>
          <img
            src={hardDotFunDiamond}
            className={styles.conversationChatIcon}
          />

          <div className={styles.assistantContainer}>
            <div id={styles.progressStream}>
              <StreamingText store={progressStore}>
                {(message) => (
                  <ContentMemo
                    role="assistant"
                    content={message}
                    onRendered={onRendered}
                  />
                )}
              </StreamingText>
            </div>
            <div id={styles.assistantStream}>
              <StreamingText store={messageStore}>
                {(message) => (
                  <ContentMemo
                    role="assistant"
                    content={message}
                    onRendered={onRendered}
                  />
                )}
              </StreamingText>
            </div>
          </div>
        </div>
      )}
      {errorText.length > 0 && (
        <div className={styles.left}>
          <img src={hardDotFunDiamond} className={styles.chatIcon} />
          <Content
            content={errorText}
            onRendered={onRendered}
            role="assistant"
          />
        </div>
      )}
    </div>
  );
};
