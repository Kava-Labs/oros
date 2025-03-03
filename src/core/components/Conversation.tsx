import styles from './Conversation.module.css';
import { memo } from 'react';
import { useSyncExternalStore } from 'react';
import { UserMessage } from './UserMessage';
import { ToolMessageContainer } from './ToolMessageContainer';
import { StreamingMessage } from './StreamingMessage';
import { ErrorMessage } from './ErrorMessage';
import { ChatCompletionAssistantMessageParam } from 'openai/resources/index';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { useAppContext } from '../context/useAppContext';
import { ToolCallProgressCards } from './ToolCallProgressCards';
import AssistantMessage from './AssistantMessage';

export interface ConversationProps {
  onRendered(): void;
}

const ConversationComponent = ({ onRendered }: ConversationProps) => {
  const { errorStore, isRequesting } = useAppContext();

  const errorText: string = useSyncExternalStore(
    errorStore.subscribe,
    errorStore.getSnapshot,
  );

  const { messages } = useMessageHistory();

  return (
    <div className={styles.conversationContainer} data-testid="conversation">
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return (
            <UserMessage key={index} content={message.content as string} />
          );
        }

        if (message.role === 'assistant' && message.content) {
          return (
            <AssistantMessage
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
          return (
            <ToolMessageContainer
              key={index}
              message={message}
              prevMessage={
                messages[index - 1] as ChatCompletionAssistantMessageParam
              }
              onRendered={onRendered}
            />
          );
        }
        return null;
      })}

      {isRequesting && <StreamingMessage onRendered={onRendered} />}

      {errorText.length > 0 && (
        <ErrorMessage errorText={errorText} onRendered={onRendered} />
      )}

      <ToolCallProgressCards onRendered={onRendered} />
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
