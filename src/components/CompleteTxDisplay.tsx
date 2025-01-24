import styles from './TxDisplay.module.css';
import { ExternalLinkIcon } from '../assets/ExternalLinkIcon';

interface CompleteTxDisplayProps {
  hash: string;
}

/**
 * TODO: Bring in currentChain so href can be built with dynamic block explorer
 */
export const CompleteTxDisplay = ({ hash }: CompleteTxDisplayProps) => (
  <div className={styles.transactionContainer}>
    <div className={styles.transactionCard}>
      <div className={styles.statusSection}>
        <h3 className={styles.sectionLabel}>Status</h3>
        <div className={styles.statusIndicator}>
          <div className={`${styles.statusDot} ${styles.complete}`}></div>
          <p className={`${styles.statusText} ${styles.complete}`}>
            Transaction Processed
          </p>
        </div>
      </div>

      <div className={styles.statusSection}>
        <h3 className={styles.sectionLabel}>Transaction Hash</h3>
        <a
          href={`https://kavascan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.hashLink}
        >
          <span className={styles.hashText}>{hash}</span>
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  </div>
);
