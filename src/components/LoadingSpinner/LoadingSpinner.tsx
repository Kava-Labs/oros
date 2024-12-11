/* Loading animations provided by https://loading.io/css/ */
import styles from './LoadingSpinner.module.css';

export const LoadingSpinner = () => {
  return (
    <div role="status" className={styles['lds-spinner']}>
      <div></div>
      <div></div>
      <div></div>
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
