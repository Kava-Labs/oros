import styles from './Conversation.module.css';
import { StreamingText } from './StreamingText';
import { StreamingTextContent } from './StreamingTextContent';
import { useAppContext } from '../context/useAppContext';

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
