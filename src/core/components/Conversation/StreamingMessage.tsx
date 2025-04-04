import styles from './Conversation.module.css';
import { AssistantStream } from './AssistantStream';
import { ModelConfig } from '../../types/models';

interface StreamingMessageProps {
  onRendered: () => void;
  modelConfig: ModelConfig;
}

export const StreamingMessage = ({
  onRendered,
  modelConfig,
}: StreamingMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <div className={styles.assistantContainer}>
        <AssistantStream onRendered={onRendered} modelConfig={modelConfig} />
      </div>
    </div>
  );
};
