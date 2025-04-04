import styles from './Conversation.module.css';
import { BrainIcon } from '../../assets/BrainIcon';

export const ProgressIcon = () => {
  return (
    <div className={`${styles.brainIconContainer} ${styles.pulsing}`}>
      <BrainIcon
        className={`${styles.brainIcon} ${styles.pulsing}`}
        aria-label="Progress Icon"
      />
    </div>
  );
};
