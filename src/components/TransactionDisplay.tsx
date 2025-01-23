import { FC } from 'react';
import './TransactionDisplay.css';
import { ExternalLinkIcon } from '../assets/ExternalLinkIcon';
import styles from './TransacactionDisplay.module.css';

interface TransactionDisplayProps {
  transactionInfo: string;
  denom: string;
  amount: string | number;
  hash?: string;
  hashLink?: string;
}

export const TransactionDisplay: FC<TransactionDisplayProps> = ({
  transactionInfo,
  denom,
  amount,
  hash,
  hashLink,
}) => {
  return (
    <div className={styles.transactionContainer}>
      <div className={styles.transactionCard}>
        {/* Transaction Info */}
        <div className={styles.transactionSection}>
          <h3 className={styles.sectionLabel}>Transaction Info</h3>
          <p className={styles.transactionInfo}>{transactionInfo}</p>
        </div>

        {/* Amount and Denom */}
        <div className={styles.transactionSection}>
          <h3 className={styles.sectionLabel}>Amount</h3>
          <p className={styles.transactionAmount}>
            {amount} {denom}
          </p>
        </div>

        {/* Hash Link */}
        {hash && (
          <div className={styles.transactionSection}>
            <h3 className={styles.sectionLabel}>Transaction Hash</h3>
            <a
              href={hashLink}
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
