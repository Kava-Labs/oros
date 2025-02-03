import styles from './DisplayCards.module.css';
import { ExternalLinkIcon } from '../../assets/ExternalLinkIcon';
import { ChainConfig } from '../../config/chainsRegistry';
import { useScrollToBottom } from '../../../../core/utils/useScrollToBottom';

export interface CompleteTxDisplayProps {
  hash: string;
  chain: ChainConfig;
  onRendered?: () => void;
}

export const CompleteTxDisplay = ({
  hash,
  chain,
  onRendered,
}: CompleteTxDisplayProps) => {
  const explorerUrl = chain.blockExplorerUrls[0] + 'tx/' + hash;

  useScrollToBottom(onRendered);

  return (
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
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.hashLink}
          >
            <span data-testid="tx-hash" className={styles.hashText}>
              {hash}
            </span>
            <ExternalLinkIcon />
          </a>
        </div>
      </div>
    </div>
  );
};
