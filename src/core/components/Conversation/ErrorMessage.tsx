import styles from './Conversation.module.css';
import { Content } from './Content';
import { ModelConfig } from '../../types/models';

interface ErrorMessageProps {
  errorText: string;
  onRendered: () => void;
  modelConfig: ModelConfig;
}

export const ErrorMessage = ({
  errorText,
  onRendered,
  modelConfig,
}: ErrorMessageProps) => {
  return (
    <div className={styles.assistantOutputContainer}>
      <div className={styles.assistantContainer}>
        <Content
          content={errorText}
          onRendered={onRendered}
          role="assistant"
          modelConfig={modelConfig}
        />
      </div>
    </div>
  );
};
