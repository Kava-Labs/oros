import styles from './Conversation.module.css';
import { AssistantStream } from './AssistantStream';

interface StreamingMessageProps {
  onRendered: () => void;
}

export const StreamingMessage = ({ onRendered }: StreamingMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <div className={styles.assistantContainer}>
        <AssistantStream onRendered={onRendered} />
      </div>
    </div>
  );
};
