import { createContext } from 'react';
import { OperationRegistry } from '../services/chain/registry';

export type ExecuteOperation = (
  operationName: string,
  params: unknown,
) => Promise<string>;

export type AppContextType = {
  errorText: string;
  setErrorText: React.Dispatch<React.SetStateAction<string>>;
  isReady: boolean;
  setIsReady: React.Dispatch<React.SetStateAction<boolean>>;
  isRequesting: boolean;
  setIsRequesting: React.Dispatch<React.SetStateAction<boolean>>;
  registry: OperationRegistry;

  getOpenAITools: () => unknown[];
  executeOperation: ExecuteOperation;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);
