import { FC } from 'react';
import './TransactionDisplay.css';
import { ExternalLinkIcon } from '../assets/ExternalLinkIcon';
import styles from './TransacactionDisplay.module.css';
import { ToolCallStream } from '../toolCallStreamStore';

interface TransactionDisplayProps {
  toolCallStreams?: Readonly<ToolCallStream>[];
  hash?: string;
}

export const TransactionDisplay: FC<TransactionDisplayProps> = ({
  toolCallStreams,
  hash,
}) => {
  return (
    <div className={styles.transactionContainer}>
      <div className={styles.transactionCard}>
        {/* Transaction Info */}
        {toolCallStreams && (
          <div className={styles.transactionSection}>
            <h3 className={styles.sectionLabel}>Transaction Info</h3>
            <p className={styles.transactionInfo}>
              Transaction process started...
            </p>
          </div>
        )}

        {/* Hash Link */}
        {hash && (
          <div className={styles.transactionSection}>
            <h3 className={styles.sectionLabel}>Transaction Hash</h3>
            <a
              href={}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.hashLink}
            >
              <span className={styles.hashLink}>{hash}</span>
              <ExternalLinkIcon />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
