import styles from './Conversation.module.css';
import { BrainIcon } from '../../assets/BrainIcon';

interface ProgressIconProps {
  progressText: string;
}

export const ProgressIcon = ({ progressText }: ProgressIconProps) => {
  //  remove when the progress store clears
  if (progressText.length === 0) return;

  return (
    <div className={`${styles.brainIconContainer} ${styles.pulsing}`}>
      <BrainIcon
        className={`${styles.brainIcon} ${styles.pulsing}`}
        aria-label="Progress Icon"
      />
    </div>
  );
};
