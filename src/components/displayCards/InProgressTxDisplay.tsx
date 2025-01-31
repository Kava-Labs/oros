import { ToolCallStream } from '../../toolCallStreamStore';
import styles from './DisplayCards.module.css';
import { useScrollToBottom } from '../../useScrollToBottom';
import { useAppContext } from '../../context/useAppContext';

export const InProgressTxDisplay = ({
  onRendered,
}: {
  toolCall: ToolCallStream;
  onRendered?: () => void;
}) => {
  const { isOperationValidated } = useAppContext();

  useScrollToBottom(onRendered, isOperationValidated);

  if (!isOperationValidated) {
    return null;
  }

  return (
    <div
      data-testid="in-progress-tx-display"
      className={styles.inprogressContainer}
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
