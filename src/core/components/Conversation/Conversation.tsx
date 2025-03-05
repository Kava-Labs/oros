import styles from './Conversation.module.css';
import { Fragment, memo } from 'react';
import { useSyncExternalStore } from 'react';
import { ToolMessageContainer } from './ToolMessageContainer';
import { StreamingMessage } from './StreamingMessage';
import { ErrorMessage } from './ErrorMessage';
import { ToolCallProgressCards } from './ToolCallProgressCards';
import { ChatCompletionAssistantMessageParam } from 'openai/resources/index';
import AssistantMessage from './AssistantMessage';
import { useAppContext } from '../../context/useAppContext';
import { useMessageHistory } from '../../hooks/useMessageHistory';
import { Content } from './Content';
import { IdbImage } from '../IdbImage';

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
          let hasImage = false;
          let imageID = '';

          let content: string =
            typeof message.content === 'string' ? message.content : '';
          if (Array.isArray(message.content)) {
            hasImage =
              message.content.find((c) => {
                if (c.type === 'image_url') {
                  imageID = c.image_url.url;
                  return true;
                }
                return false;
              }) !== undefined;
            for (const msgContent of message.content) {
              if (msgContent.type === 'text') {
                content = msgContent.text;
                break;
              }
            }
          } else if (index > 1 && messages[index - 1].role === 'system') {
            const prevMsg = messages[index - 1];
            if (
              typeof prevMsg.content === 'string' &&
              prevMsg.content.includes('"imageID":')
            ) {
              hasImage = true;
              imageID = JSON.parse(prevMsg.content).imageID;
            }
          }

          if (!content.length) {
            // useful warning to catch bugs during dev
            console.warn(
              'failed to correctly parse message content',
              message.content,
            );
          }

          return (
            <Fragment key={index}>
              <div
                style={{
                  marginLeft: 'auto',
                  marginBottom: '4px',
                  marginTop: '4px',
                }}
              >
                {hasImage ? (
                  <IdbImage width="256px" height="256px" id={imageID} />
                ) : null}
              </div>
              <div className={styles.userInputContainer}>
                <Content role={message.role} content={content} />
              </div>
            </Fragment>
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
