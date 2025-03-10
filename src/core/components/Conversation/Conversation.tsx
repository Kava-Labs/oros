import styles from './Conversation.module.css';
import { Fragment, memo, useState } from 'react';
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
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const handleImageLoad = (imageID: string) => {
    setLoadedImages((prev) => ({
      ...prev,
      [imageID]: true,
    }));
  };

  return (
    <div className={styles.conversationContainer} data-testid="conversation">
      {messages.map((message, index) => {
        if (message.role === 'user') {
          let hasImage = false;
          let imageIDs: string[] = [];

          let content: string =
            typeof message.content === 'string' ? message.content : '';
          if (Array.isArray(message.content)) {
            message.content.forEach((c) => {
              if (c.type === 'image_url') {
                imageIDs.push(c.image_url.url);
                hasImage = true;
              }
            });
            for (const msgContent of message.content) {
              if (msgContent.type === 'text') {
                content = msgContent.text;
                break;
              }
            }
          } else if (index > 0 && messages[index - 1].role === 'system') {
            const prevMsg = messages[index - 1];
            if (
              typeof prevMsg.content === 'string' &&
              prevMsg.content.includes('"imageIDs":')
            ) {
              hasImage = true;
              imageIDs = JSON.parse(prevMsg.content).imageIDs;
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
              {hasImage
                ? imageIDs.map((imageID, i) => (
                    <div key={imageID} className={styles.chatImage}>
                      {!loadedImages[imageID] && (
                        <div className={styles.imageSkeleton}></div>
                      )}
                      <IdbImage
                        width="256px"
                        height="256px"
                        id={imageID}
                        aria-label={`User uploaded image ${i + 1}`}
                        onLoad={() => handleImageLoad(imageID)}
                      />
                    </div>
                  ))
                : null}

              <div className={styles.userInputContainer}>
                <Content
                  role={message.role}
                  content={content}
                  data-testid="user-message"
                />
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
