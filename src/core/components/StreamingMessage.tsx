import styles from './Conversation.module.css';
import KavaIcon from '../assets/KavaIcon';
import { ProgressStream } from './ProgressStream';
import { AssistantStream } from './AssistantStream';

interface StreamingMessageProps {
  onRendered: () => void;
}

export const StreamingMessage = ({ onRendered }: StreamingMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <KavaIcon className={styles.conversationChatIcon} />

      <div className={styles.assistantContainer}>
        <ProgressStream onRendered={onRendered} />
        <AssistantStream onRendered={onRendered} />
      </div>
    </div>
  );
};
