import styles from './Conversation.module.css';
import { Content } from './Content';

interface ErrorMessageProps {
  errorText: string;
  onRendered: () => void;
}

export const ErrorMessage = ({ errorText, onRendered }: ErrorMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <div className={styles.assistantContainer}>
        <Content content={errorText} onRendered={onRendered} role="assistant" />
      </div>
    </div>
  );
};
