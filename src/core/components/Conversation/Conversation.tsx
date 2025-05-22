import styles from './Conversation.module.css';
import { Fragment, memo } from 'react';
import { useSyncExternalStore } from 'react';
import { StreamingMessage } from './StreamingMessage';
import { ErrorMessage } from './ErrorMessage';
import AssistantMessage from './AssistantMessage';
import { Content } from './Content';
import { IdbImage } from '../IdbImage';
import { ImageCarousel } from './ImageCarousel';
import { ProgressIcon } from './ProgressIcon';
import { ModelConfig } from '../../types/models';
import { TextStreamStore } from 'lib-kava-ai';
import { ChatMessage } from '../../stores/messageHistoryStore';

export interface ConversationProps {
  isRequesting: boolean;
  onRendered(): void;
  modelConfig: ModelConfig;
  errorStore: TextStreamStore;
  messageStore: TextStreamStore;
  messages: ChatMessage[];
  thinkingStore: TextStreamStore;
}

const ConversationComponent = ({
  isRequesting,
  onRendered,
  modelConfig,
  errorStore,
  messageStore,
  messages,
  thinkingStore,
}: ConversationProps) => {
  const errorText: string = useSyncExternalStore(
    errorStore.subscribe,
    errorStore.getSnapshot,
  );

  const assistantStream = useSyncExternalStore(
    messageStore.subscribe,
    messageStore.getSnapshot,
  );

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
                    <ImageCarousel imageIDs={imageIDs} />
                  ) : (
                    <IdbImage
                      width="256px"
                      height="256px"
                      id={imageIDs[0]}
                      aria-label="File upload chat message"
                    />
                  )}
                </div>
              ) : null}

              <div className={styles.userInputContainer}>
                <Content
                  role={message.role}
                  content={content}
                  data-testid="user-message"
                  modelConfig={modelConfig}
                />
              </div>
            </Fragment>
          );
        }

        if (message.role === 'assistant' && message.content) {
          return (
            <AssistantMessage
              key={index}
              modelConfig={modelConfig}
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

      <StreamingMessage
        thinkingStore={thinkingStore}
        messageStore={messageStore}
        onRendered={onRendered}
        modelConfig={modelConfig}
      />

      {errorText.length > 0 && (
        <ErrorMessage
          errorText={errorText}
          onRendered={onRendered}
          modelConfig={modelConfig}
        />
      )}
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
