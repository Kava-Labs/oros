import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useChat } from '../components/hooks/useChat';

interface AppContext {
  address: string;
  connectWallet: () => Promise<void>;
}

const initValues = {
  address: "",
  connectWallet: async () => {
    throw new Error("Uninitialized");
  },
};

export const AppContext = createContext<AppContext>(initValues);

export function AppContextProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const [address, setAddress] = useState("");
  const { submitChatMessage } = useChat();

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      return;
    }


    const accounts: string[] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    if (accounts && accounts[0]) {
      setAddress(() => accounts[0]);
      submitChatMessage(`connected my wallet: ${accounts[0]}`);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        address,
        connectWallet,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
};

export default AppContext;
