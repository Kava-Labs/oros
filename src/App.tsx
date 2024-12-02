import kavaLogo from "./assets/kavaLogo.svg";
import { useAppContext } from "./contexts/AppContext";
import { DemoBanner } from "./components/DemoBanner";
import styles from "./style.module.css";
import { Chat } from './components/chat';


export function App() {
    const { clearChatMessages } = useAppContext();

    return (
        <>
            <Header />
            <main>
                <DemoBanner />
                <Chat />
                <DeployControls
                    clearMessages={clearChatMessages}
                />
            </main>
        </>
    );
}


function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.logoContainer}>
                <img src={kavaLogo} alt="Logo" height={35} />
            </div>
        </header>
    );
}

type DisplayControlsProps = {
    clearMessages: () => void;
};

function DeployControls({ clearMessages }: DisplayControlsProps) {
    return (
        <div className={styles.deployControls}>
            <ConnectWallet />
            <button className={styles.inactive}>Deploy</button>
            <ResetChatButton clearMessages={clearMessages} />
        </div>
    );
}

function ConnectWallet() {
    const { connectWallet, address } = useAppContext();
    return (
        <button
            className={styles.active}
            onClick={(e) => {
                e.preventDefault();
                connectWallet();
            }}
        >
            {address ? 'Re-connect Wallet' : 'Connect Wallet'}
        </button>
    );
}



function ResetChatButton({ clearMessages }: { clearMessages: () => void }) {
    return (
        <button className={styles.active} onClick={clearMessages}>
            Reset Chat
        </button>
    );
}
