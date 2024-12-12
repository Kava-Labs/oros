import { useAppContext } from '../../../contexts/AppContext';
import styles from '../styles.module.css';

export const ConnectWallet = () => {
  const { connectWallet, address } = useAppContext();
  return (
    <button
      className={styles.connectWalletButton}
      onClick={(e) => {
        e.preventDefault();
        connectWallet();
      }}
    >
      {address ? 'Re-connect Wallet' : 'Connect Wallet'}
    </button>
  );
};
