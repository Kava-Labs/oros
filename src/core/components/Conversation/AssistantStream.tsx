import styles from './Conversation.module.css';
import { ThinkingStream } from './ThinkingStream';
import { MessageStream } from './MessageStream';
import { ModelConfig } from '../../types/models';
import { TextStreamStore } from 'lib-kava-ai';

interface AssistantStreamProps {
  onRendered: () => void;
  modelConfig: ModelConfig;
  messageStore: TextStreamStore;
  thinkingStore: TextStreamStore;
}

export const AssistantStream = ({
  onRendered,
  modelConfig,
  thinkingStore,
  messageStore,
}: AssistantStreamProps) => {
  return (
    <div id={styles.assistantStream}>
      <ThinkingStream
        thinkingStore={thinkingStore}
        onRendered={onRendered}
        modelConfig={modelConfig}
      />
      <MessageStream
        messageStore={messageStore}
        onRendered={onRendered}
        modelConfig={modelConfig}
      />
    </div>
  );
};
