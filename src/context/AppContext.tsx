import { createContext } from 'react';

export type AppContextType = {
  errorText: string;
  setErrorText: (e: string) => void;
  isReady: boolean;
  setIsReady: (i: boolean) => void;
  isRequesting: boolean;
  setIsRequesting: (i: boolean) => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);
