import { useEffect } from 'react';
import { ToolCallStream } from '../toolCallStreamStore';
import styles from './TxDisplay.module.css';

export const InProgressTxDisplay = ({
  onRendered,
}: {
  toolCall: ToolCallStream;
  onRendered?: () => void;
}) => {
  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [onRendered]);

  return (
    <div
      data-testid="in-progress-tx-display"
      className={styles.transactionContainer}
    >
      <div className={styles.transactionCard}>
        <div className={styles.statusSection}>
          <h3 className={styles.sectionLabel}>Status</h3>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${styles.inProgress}`}></div>
            <p className={`${styles.statusText} ${styles.inProgress}`}>
              Transaction in Progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
