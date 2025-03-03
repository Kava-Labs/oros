import styles from './Conversation.module.css';
import { Content } from './Content';
import { StreamingText } from './StreamingText';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { memo, useSyncExternalStore } from 'react';
import { useAppContext } from '../context/useAppContext';
import { ToolCallProgressCards } from './ToolCallProgressCards';
import {
  CompleteTxDisplay,
  CompleteQueryDisplay,
} from '../../features/blockchain/components/displayCards';
import {
  chainNameToolCallParam,
  chainRegistry,
} from '../../features/blockchain/config/chainsRegistry';
import {
  OperationResult,
  OperationType,
} from '../../features/blockchain/types/chain';
import KavaIcon from '../assets/KavaIcon';
import AssistantMessage from './AssistantMessage';
import { ThinkingContent } from './ThinkingContent';
import { useMessageHistory } from '../hooks/useMessageHistory';

export interface ConversationProps {
  onRendered(): void;
}

const StreamingTextContent = (message: string, onRendered: () => void) => {
  return <Content role="assistant" content={message} onRendered={onRendered} />;
};

const ConversationComponent = ({ onRendered }: ConversationProps) => {
  const {
    errorStore,
    isRequesting,
    progressStore,
    messageStore,
    registry,
    thinkingStore,
  } = useAppContext();

  const errorText = useSyncExternalStore(
    errorStore.subscribe,
    errorStore.getSnapshot,
  );

  const { messages } = useMessageHistory();

  return (
    <div className={styles.conversationContainer} data-testid="conversation">
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return (
            <div key={index} className={styles.userInputContainer}>
              <Content
                role={message.role}
                content={message.content as string}
              />
            </div>
          );
        }

        if (message.role === 'assistant' && message.content) {
          return (
            <AssistantMessage
              key={index}
              content={message.content as string}
              reasoningContent={
                'reasoningContent' in message
                  ? message.reasoningContent
                  : undefined
              }
            />
          );
        }

        if (message.role === 'tool') {
          const id = message.tool_call_id;
          const prevMsg = messages[index - 1] as ChatCompletionMessageParam;
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
        <div className={styles.assistantOutputContainer}>
          <KavaIcon className={styles.conversationChatIcon} />

          <div className={styles.assistantContainer}>
            <div className={styles.progressStream}>
              <StreamingText store={progressStore} onRendered={onRendered}>
                {StreamingTextContent}
              </StreamingText>
            </div>
            <div id={styles.assistantStream}>
              <StreamingText store={thinkingStore} onRendered={onRendered}>
                {(msg) => (
                  <ThinkingContent
                    content={msg}
                    isStreaming={true}
                    onRendered={onRendered}
                  />
                )}
              </StreamingText>

              <StreamingText store={messageStore} onRendered={onRendered}>
                {StreamingTextContent}
              </StreamingText>
            </div>
          </div>
        </div>
      )}
      {errorText.length > 0 && (
        <div className={styles.assistantOutputContainer}>
          <KavaIcon className={styles.conversationChatIcon} />
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
