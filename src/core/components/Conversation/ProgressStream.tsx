import styles from './Conversation.module.css';
import { useAppContext } from '../../context/useAppContext';
import { StreamingText } from '.././Conversation/StreamingText';
import { StreamingTextContent } from '.././Conversation/StreamingTextContent';
import { useSyncExternalStore } from 'react';
import { ProgressIcon } from './ProgressIcon';

interface ProgressStreamProps {
  onRendered: () => void;
}

export const ProgressStream = ({ onRendered }: ProgressStreamProps) => {
  const { progressStore } = useAppContext();

  const progressText = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
  );

  return (
    <div className={styles.progressStream}>
      <ProgressIcon progressText={progressText} />
      <StreamingText store={progressStore} onRendered={onRendered}>
        {StreamingTextContent}
      </StreamingText>
    </div>
  );
};
