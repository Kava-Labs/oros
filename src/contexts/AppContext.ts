import { createContext } from 'react';
import { appStore as _appStore } from '../stores';

interface IAppContext {
  address: string;
  connectWallet: () => Promise<void>;
  submitUserChatMessage: (msg: string) => void;
  cancelStream: (() => void) | null;
  clearChatMessages: () => void;
  markDownCache: React.MutableRefObject<Map<string, string>>;
}

export const mdCache = new Map<string, string>();
const initValues = {
  address: '',
  connectWallet: async () => {
    throw new Error('Uninitialized');
  },
  submitUserChatMessage: () => {
    throw new Error('Uninitialized');
  },
  clearChatMessages: () => {
    throw new Error('Uninitialized');
  },
  cancelStream: null,
  markDownCache: { current: mdCache },
};

export const AppContext = createContext<IAppContext>(initValues);
export default AppContext;
