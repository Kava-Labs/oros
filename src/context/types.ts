import type { ChatCompletionTool } from 'openai/resources/index';
import { OperationRegistry } from '../features/blockchain/services/registry';
import { WalletStore } from '../features/blockchain/stores/walletStore';
import { TextStreamStore } from '../core/stores/textStreamStore';
import { ToolCallStreamStore } from '../core/stores/toolCallStreamStore';
import { MessageHistoryStore } from '../core/stores/messageHistoryStore';

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
  registry: OperationRegistry<unknown>;
  modelConfig: ModelConfig;
  executeOperation: ExecuteOperation;
  walletStore: WalletStore;
  messageStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
  isOperationValidated: boolean;
};

export interface ModelConfig {
  name: string;
  description: string;
  tools: ChatCompletionTool[];
  systemPrompt: string;
  introText: string;
}
