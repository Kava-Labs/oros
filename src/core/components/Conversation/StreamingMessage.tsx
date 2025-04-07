import styles from './Conversation.module.css';
import { AssistantStream } from './AssistantStream';
import { ModelConfig } from '../../types/models';
import { TextStreamStore } from 'lib-kava-ai';

interface StreamingMessageProps {
  onRendered: () => void;
  modelConfig: ModelConfig;
  thinkingStore: TextStreamStore;
  messageStore: TextStreamStore;
}

export const StreamingMessage = ({
  onRendered,
  modelConfig,
  thinkingStore,
  messageStore,
}: StreamingMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <div className={styles.assistantContainer}>
        <AssistantStream
          thinkingStore={thinkingStore}
          messageStore={messageStore}
          onRendered={onRendered}
          modelConfig={modelConfig}
        />
      </div>
    </div>
  );
};
