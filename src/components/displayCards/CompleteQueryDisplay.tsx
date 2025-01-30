import { Coin } from '../../tools/api';
import { useScrollToBottom } from '../../useScrollToBottom';
import styles from './DisplayCards.module.css';

interface CompleteQueryDisplayProps {
  content: string;
  onRendered: () => void;
}

export const CompleteQueryDisplay = ({
  content,
  onRendered,
}: CompleteQueryDisplayProps) => {
  const formatBalances = (content: string) => {
    return content
      .split('\n')
      .filter(Boolean)
      .map((line: string) => {
        const [denom, amount] = line.split(':').map((s: string) => s.trim());
        return { denom, amount } as Coin;
      });
  };

  const balances = formatBalances(content);

  useScrollToBottom(onRendered);

  return (
    <div className={styles.transactionContainer}>
      <div className={styles.transactionCard}>
        <div className={styles.statusSection}>
          <h3 className={styles.sectionLabel}>Balances</h3>
          <div className={styles.balanceGrid}>
            {balances.map(({ denom, amount }, index) => (
              <div
                data-testid={`${denom}-balance-row`}
                key={index}
                className={styles.balanceRow}
              >
                <span className={styles.assetName}>{denom}</span>
                <span className={styles.assetAmount}>{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
