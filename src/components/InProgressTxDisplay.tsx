import styles from './TxDisplay.module.css';

export const InProgressTxDisplay = () => (
  <div className={styles.transactionContainer}>
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
