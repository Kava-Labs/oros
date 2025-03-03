import styles from './Conversation.module.css';
import { Content } from './Content';

interface UserMessageProps {
  content: string;
}

export const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <div className={styles.userInputContainer}>
      <Content role="user" content={content} />
    </div>
  );
};
