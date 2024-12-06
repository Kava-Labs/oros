import styles from "../../style.module.css";
import { ConnectWallet } from "./ConnectWallet";
import { ResetButton } from "./ResetButton";

type ChatControlsProps = {
  clearMessages: () => void;
};

export const ChatControls = ({ clearMessages }: ChatControlsProps) => {
  return (
    <div className={styles.deployControls}>
      <ConnectWallet />
      <button className={styles.inactive}>Deploy</button>
      <ResetButton clearMessages={clearMessages} />
    </div>
  );
};
