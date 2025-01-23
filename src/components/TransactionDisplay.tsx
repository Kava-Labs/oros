import { FC } from 'react';
import styles from './TransactionDisplay.module.css';
import { ToolCallStream } from '../toolCallStreamStore';

export const TransactionDisplay: FC<ToolCallStream> = () => {
  return (
    <div className={styles.transactionContainer}>
      <div className={styles.transactionCard}>
        <h3 className={styles.sectionLabel}>Transaction Info</h3>
        <p className={styles.transactionInfo}>Transaction process started...</p>
      </div>
    </div>
  );
};
