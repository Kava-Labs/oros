import styles from './ChatView.module.css';
import { Content } from './Content';
import { StreamingText } from './StreamingText';
import { messageStore, progressStore, toolCallStreamStore } from './store';
import { ToolFunctions, GenerateCoinMetadataResponse } from './tools/types';
import { TokenCard, TokenCardsStreamingPlaceholder } from './TokenCard';

import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { memo } from 'react';
import { useTheme } from './theme/useTheme';

export interface ConversationProps {
  messages: ChatCompletionMessageParam[];
  errorText: string;
  isRequesting: boolean;

  onRendered(): void;
}

const StreamingTextContent = (message: string, onRendered: () => void) => {
  return (
    <Content
      message={{ role: 'assistant', content: message }}
      onRendered={onRendered}
    />
  );
};

const ConversationComponent = ({
  messages,
  errorText,
  isRequesting,
  onRendered,
}: ConversationProps) => {
  const { logo } = useTheme();

  return (
    <div id={styles.conversation} data-testid="conversation">
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return (
            <div key={index} className={styles.right}>
              <Content message={message} />
            </div>
          );
        }

        if (message.role === 'assistant' && message.content) {
          return (
            <div key={index} className={styles.left}>
              <img src={logo} className={styles.conversationChatIcon} />
              <div className={styles.assistantContainer}>
                <Content message={message} />
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
                prompt={
                  JSON.parse(prevMsg.tool_calls[0].function.arguments).prompt
                }
                onRendered={onRendered}
              />
            </div>
          );
        }

        return null;
      })}
      {isRequesting && (
        <div className={styles.left}>
          <img src={logo} className={styles.conversationChatIcon} />

          <div className={styles.assistantContainer}>
            <div id={styles.progressStream}>
              <StreamingText store={progressStore} onRendered={onRendered}>
                {StreamingTextContent}
              </StreamingText>
            </div>
            <div id={styles.assistantStream}>
              <StreamingText store={messageStore} onRendered={onRendered}>
                {StreamingTextContent}
              </StreamingText>
            </div>
          </div>
        </div>
      )}
      {errorText.length > 0 && (
        <div className={styles.left}>
          <img src={logo} className={styles.conversationChatIcon} />
          <div className={styles.assistantContainer}>
            <Content
              message={{ role: 'assistant', content: errorText }}
              onRendered={onRendered}
            />
          </div>
        </div>
      )}

      <TokenCardsStreamingPlaceholder
        toolCallStreamStore={toolCallStreamStore}
        onRendered={onRendered}
      />
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
