import styles from './Conversation.module.css';
import { useAppContext } from '../../context/useAppContext';
import { StreamingText } from '.././Conversation/StreamingText';
import { StreamingTextContent } from '.././Conversation/StreamingTextContent';
import { ProgressIcon } from './ProgressIcon';
import { useTextStreamStore } from 'lib-kava-ai';

interface ProgressStreamProps {
  onRendered: () => void;
}

export const ProgressStream = ({ onRendered }: ProgressStreamProps) => {
  const { progressStore } = useAppContext();

  const progressText = useTextStreamStore(progressStore);

  return (
    <div className={styles.progressStream}>
      <ProgressIcon progressText={progressText} />
      <StreamingText store={progressStore} onRendered={onRendered}>
        {StreamingTextContent}
      </StreamingText>
    </div>
  );
};
