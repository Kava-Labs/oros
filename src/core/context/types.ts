import { MessageHistoryStore } from '../../core/stores/messageHistoryStore';
import { TextStreamStore } from '../../core/stores/textStreamStore';
import { ToolCallStreamStore } from '../../core/stores/toolCallStreamStore';
import { ModelConfig } from '../../core/types/models';
import { WalletStore } from '../../features/blockchain/stores/walletStore';

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
  modelConfig: ModelConfig;
  handleModelChange: (modelName: string) => void;
  walletStore: WalletStore;
  messageStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
  // Optional operations that will be present for blockchain models
  executeOperation?: ExecuteOperation;
  isOperationValidated?: boolean;
};
