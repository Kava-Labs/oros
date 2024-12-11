/* Loading animations provided by https://loading.io/css/ */
import styles from './LoadingSpinner.module.css';

export const LoadingSpinner = () => {
  return (
    <div role="status" className={styles['lds-grid']}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};
