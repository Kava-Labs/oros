import styles from '../styles.module.css';

export const ResetButton = ({
  clearMessages,
}: {
  clearMessages: () => void;
}) => {
  return (
    <button className={styles.active} onClick={clearMessages}>
      Reset Chat
    </button>
  );
};
