import styles from './Conversation.module.css';
import { useAppContext } from '../context/useAppContext';
import { Content } from './Content';
import KavaIcon from '../assets/KavaIcon';
import { StreamingText } from './StreamingText';
import { ThinkingContent } from './ThinkingContent';

interface LoadingStateProps {
  onRendered: () => void;
}

export const LoadingState = ({ onRendered }: LoadingStateProps) => {
  const { progressStore, messageStore, thinkingStore } = useAppContext();

  const StreamingTextContent = (message: string) => {
    return (
      <Content role="assistant" content={message} onRendered={onRendered} />
    );
  };

  return (
    <div className={styles.assistantOutputContainer}>
      <KavaIcon className={styles.conversationChatIcon} />

      <div className={styles.assistantContainer}>
        <div className={styles.progressStream}>
          <StreamingText store={progressStore} onRendered={onRendered}>
            {StreamingTextContent}
          </StreamingText>
        </div>
        <div id={styles.assistantStream}>
          <StreamingText store={thinkingStore} onRendered={onRendered}>
            {(msg) => (
              <ThinkingContent
                content={msg}
                isStreaming={true}
                onRendered={onRendered}
              />
            )}
          </StreamingText>

          <StreamingText store={messageStore} onRendered={onRendered}>
            {StreamingTextContent}
          </StreamingText>
        </div>
      </div>
    </div>
  );
};
