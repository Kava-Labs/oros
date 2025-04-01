import styles from './Conversation.module.css';
import { Fragment, memo, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { StreamingMessage } from './StreamingMessage';
import { ErrorMessage } from './ErrorMessage';
import AssistantMessage from './AssistantMessage';
import { useAppContext } from '../../context/useAppContext';
import { useMessageHistory } from '../../hooks/useMessageHistory';
import { Content } from './Content';
import { IdbImage } from '../IdbImage';
import { ImageCarousel } from './ImageCarousel';
import { ProgressIcon } from './ProgressIcon';

export interface ConversationProps {
  onRendered(): void;
}

const ConversationComponent = ({ onRendered }: ConversationProps) => {
  const { errorStore, isRequesting, messageStore } = useAppContext();

  const errorText: string = useSyncExternalStore(
    errorStore.subscribe,
    errorStore.getSnapshot,
  );

  const assistantStream = useSyncExternalStore(
    messageStore.subscribe,
    messageStore.getSnapshot,
  );

  const { messages } = useMessageHistory();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleFileLoad = () => {
    setIsLoaded(true);
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
          }
          if (index > 0 && messages[index - 1].role === 'system') {
            let i = index - 1;
            while (i > 0) {
              const prevMsg = messages[i];
              if (prevMsg.role !== 'system') break;
              if (
                typeof prevMsg.content === 'string' &&
                prevMsg.content.includes('"imageIDs":')
              ) {
                hasImage = true;
                imageIDs = [
                  ...imageIDs,
                  ...JSON.parse(prevMsg.content).imageIDs,
                ];
              }

              i--;
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
              {hasImage ? (
                <div className={styles.chatImage}>
                  {imageIDs.length > 1 ? (
                    <ImageCarousel
                      imageIDs={imageIDs}
                      isLoaded={isLoaded}
                      handleLoaded={handleFileLoad}
                    />
                  ) : (
                    <>
                      {!isLoaded && (
                        <div className={styles.imageSkeleton}></div>
                      )}
                      <IdbImage
                        width="256px"
                        height="256px"
                        id={imageIDs[0]}
                        aria-label="File upload chat message"
                        onLoad={handleFileLoad}
                      />
                    </>
                  )}
                </div>
              ) : null}

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

        return null;
      })}

      {isRequesting && assistantStream.length === 0 ? (
        <ProgressIcon />
      ) : (
        <StreamingMessage onRendered={onRendered} />
      )}

      {errorText.length > 0 && (
        <ErrorMessage errorText={errorText} onRendered={onRendered} />
      )}
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
