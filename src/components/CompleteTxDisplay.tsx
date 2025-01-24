import styles from './TxDisplay.module.css';
import { ExternalLinkIcon } from '../assets/ExternalLinkIcon';
import { ChainConfig } from '../config/chainsRegistry';

interface CompleteTxDisplayProps {
  hash: string;
  chain: ChainConfig;
}

export const CompleteTxDisplay = ({ hash, chain }: CompleteTxDisplayProps) => {
  const explorerUrl = chain.blockExplorerUrls[0] + 'tx/' + hash;

  return (
    <div
      data-testid="complete-tx-display"
      className={styles.transactionContainer}
    >
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
            href={explorerUrl}
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
};
