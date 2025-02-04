import styles from './ChatView.module.css';
import { Content } from './Content';
import { StreamingText } from '../core/components/StreamingText';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { memo } from 'react';
import { useTheme } from '../shared/theme/useTheme';
import { useAppContext } from '../core/context/useAppContext';
import { ToolCallProgressCards } from '../core/components/ToolCallProgressCards';
import {
  CompleteTxDisplay,
  CompleteQueryDisplay,
} from '../features/blockchain/components/displayCards';
import {
  chainNameToolCallParam,
  chainRegistry,
} from '../features/blockchain/config/chainsRegistry';
import {
  OperationResult,
  OperationType,
} from '../features/blockchain/types/chain';

export interface ConversationProps {
  messages: ChatCompletionMessageParam[];
  onRendered(): void;
}

const StreamingTextContent = (message: string, onRendered: () => void) => {
  return <Content role="assistant" content={message} onRendered={onRendered} />;
};

const ConversationComponent = ({ messages, onRendered }: ConversationProps) => {
  const { logo } = useTheme();
  const { errorText, isRequesting, progressStore, messageStore, registry } =
    useAppContext();

  return (
    <div id={styles.conversation} data-testid="conversation">
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return (
            <div key={index} className={styles.right}>
              <Content
                role={message.role}
                content={message.content as string}
              />
            </div>
          );
        }

        if (message.role === 'assistant' && message.content) {
          return (
            <div key={index} className={styles.left}>
              <img src={logo} className={styles.conversationChatIcon} />
              <div className={styles.assistantContainer}>
                <Content
                  role={message.role}
                  content={message.content as string}
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

          const params = JSON.parse(tc.function.arguments);
          if (
            typeof params === 'object' &&
            params !== null &&
            chainNameToolCallParam.name in params
          ) {
            const chainName = params[chainNameToolCallParam.name];
            const operation = registry.get(tc.function.name);
            if (!operation) return null;

            const chain = chainRegistry[operation.chainType][chainName];
            const content: OperationResult = JSON.parse(
              message.content as string,
            );
            if (content.status !== 'ok') {
              return null;
            }

            if (operation.operationType === OperationType.QUERY) {
              return (
                <CompleteQueryDisplay
                  key={index}
                  content={content.info}
                  onRendered={onRendered}
                />
              );
            } else {
              return (
                <CompleteTxDisplay
                  key={index}
                  hash={content.info}
                  chain={chain}
                />
              );
            }
          }

          return null;
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
              content={errorText}
              onRendered={onRendered}
              role="assistant"
            />
          </div>
        </div>
      )}

      <ToolCallProgressCards onRendered={onRendered} />
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
