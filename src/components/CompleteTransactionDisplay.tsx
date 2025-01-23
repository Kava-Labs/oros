import styles from './InProgressTxDisplay.module.css';
import { ExternalLinkIcon } from '../assets/ExternalLinkIcon';

interface TransactionDisplayProps {
  toolResponse: any;
  hash: string;
}

export const TransactionDisplay = ({
  toolResponse,
  hash,
}: TransactionDisplayProps) => {
  const getPairedParams = () => {
    const { id, ...displayParams } = toolResponse;
    const keys = Object.keys(displayParams);
    const pairs = [];

    for (let i = 0; i < keys.length; i += 2) {
      pairs.push(keys.slice(i, i + 2));
    }

    return pairs;
  };

  // This could be better
  const formatParamKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className={styles.transactionContainer}>
      {/* Transaction Info */}
      <div className={styles.transactionCard}>
        <h3 className={styles.sectionLabel}>Transaction Info</h3>
        <p className={styles.transactionInfo}>Transaction complete</p>
      </div>

      {/* Hash Link */}
      {hash && (
        <div className={styles.transactionSection}>
          <h3 className={styles.sectionLabel}>Transaction Hash</h3>
          <a
            href={hash}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.hashLink}
          >
            <span className={`${styles.hashText} ${styles.monospace}`}>
              {hash}
            </span>
            <ExternalLinkIcon />
          </a>
        </div>
      )}

      {/* Dynamic Parameters */}
      <div className={styles.paramsContainer}>
        {getPairedParams().map((pair, rowIndex) => (
          <div key={rowIndex} className={styles.paramRow}>
            {pair.map((key) => (
              <div key={key} className={styles.transactionSection}>
                <h3 className={styles.sectionLabel}>{formatParamKey(key)}</h3>
                <p
                  className={`${styles.sectionValue} ${
                    key.toLowerCase().includes('address') ||
                    key.toLowerCase().includes('hash')
                      ? styles.monospace
                      : ''
                  }`}
                >
                  {toolResponse[key]}
                </p>
              </div>
            ))}
            {pair.length === 1 && <div className={styles.transactionSection} />}
          </div>
        ))}
      </div>
    </div>
  );
};
