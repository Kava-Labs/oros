import styles from './ChatView.module.css';
import hardDotFunDiamond from './assets/hardDotFunDiamond.svg';
import { Content } from './Content';
import { StreamingText } from './StreamingText';
import { messageStore, progressStore, toolCallStreamStore } from './store';
import { ToolFunctions, GenerateCoinMetadataResponse } from './tools/types';
import { TokenCard, TokenCardsStreamingPlaceholder } from './TokenCard';

import type { ChatCompletionMessageParam } from 'openai/resources/index';

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
              <Content
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
                <Content
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
          if (tc.function.name !== ToolFunctions.GENERATE_COIN_METADATA) {
            return null;
          }

          const toolResponse: GenerateCoinMetadataResponse = JSON.parse(
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
                  <Content
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
                  <Content
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
          <img
            src={hardDotFunDiamond}
            className={styles.conversationChatIcon}
          />
          <div className={styles.assistantContainer}>
            <Content
              content={errorText}
              onRendered={onRendered}
              role="assistant"
            />
          </div>
        </div>
      )}

      <TokenCardsStreamingPlaceholder
        toolCallStreamStore={toolCallStreamStore}
      />
    </div>
  );
};
