import styles from './Conversation.module.css';
import { ProgressIcon } from './ProgressIcon';

export const ProgressStream = () => {
  return (
    <div className={styles.progressStream}>
      <ProgressIcon />
    </div>
  );
};
