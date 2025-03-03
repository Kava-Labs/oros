import styles from './Conversation.module.css';
import { useAppContext } from '../context/useAppContext';
import { StreamingText } from './Conversation/StreamingText';
import { StreamingTextContent } from './Conversation/StreamingTextContent';

interface ProgressStreamProps {
  onRendered: () => void;
}

export const ProgressStream = ({ onRendered }: ProgressStreamProps) => {
  const { progressStore } = useAppContext();

  return (
    <div className={styles.progressStream}>
      <StreamingText store={progressStore} onRendered={onRendered}>
        {StreamingTextContent}
      </StreamingText>
    </div>
  );
};
