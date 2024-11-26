import {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
  } from "react";
  import type { ReactNode, RefObject } from "react";
  import { DeepChat } from "deep-chat";
  
  interface AppContext {
    address: string;
    connectWallet: () => Promise<void>;
    deepChatRef: RefObject<HTMLDivElement>;
  }
  
  const initValues = {
    deepChatRef: { current: null },
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
    const deepChatRef: React.RefObject<HTMLDivElement> = useRef(null);
    const [address, setAddress] = useState("");
  
    const connectWallet = useCallback(async () => {
      if (deepChatRef.current == null) {
        return;
      }
      // @ts-expect-error TODO: update globalThis to include ethereum
      if (!window.ethereum) {
        return;
      }
  
      // @ts-ignore
      const deepChat = deepChatRef.current.children[0] as DeepChat;
      if (!deepChat) {
        return;
      }
  
      // @ts-expect-error TODO: update globalThis to include ethereum
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts[0]) {
        setAddress(() => accounts[0]);
        // a bit hacky but as per https://deepchat.dev/docs/methods they mention
        // Make sure the Deep Chat component has been fully rendered on the DOM before using these.
        // so we wait for the setAddress call to trigger a rerender before submitting
        setTimeout(() => {
          deepChat.submitUserMessage({
            text: `connected my wallet: ${accounts[0]}`,
          });
        }, 50);
      }
    }, []);
  
    return (
      <AppContext.Provider
        value={{
          deepChatRef,
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
  