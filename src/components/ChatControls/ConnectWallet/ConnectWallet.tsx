import { useAppContext } from "../../../contexts/AppContext";
import styles from "../../../style.module.css";

export const ConnectWallet = () => {
  const { connectWallet, address } = useAppContext();
  return (
    <button
      className={styles.active}
      onClick={(e) => {
        e.preventDefault();
        connectWallet();
      }}
    >
      {address ? "Re-connect Wallet" : "Connect Wallet"}
    </button>
  );
};
