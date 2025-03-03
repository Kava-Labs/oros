import styles from './Conversation.module.css';
import KavaIcon from '../../assets/KavaIcon';
import { Content } from './Content';

interface ErrorMessageProps {
  errorText: string;
  onRendered: () => void;
}

export const ErrorMessage = ({ errorText, onRendered }: ErrorMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <KavaIcon className={styles.conversationChatIcon} />
      <div className={styles.assistantContainer}>
        <Content content={errorText} onRendered={onRendered} role="assistant" />
      </div>
    </div>
  );
};
