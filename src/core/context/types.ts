import { OperationRegistry } from '../../features/blockchain/services/registry';
import { WalletStore } from '../../features/blockchain/stores/walletStore';
import { TextStreamStore } from '../../core/stores/textStreamStore';
import { ToolCallStreamStore } from '../../core/stores/toolCallStreamStore';
import { MessageHistoryStore } from '../../core/stores/messageHistoryStore';
import { ModelConfig, SupportedModels } from '../types/models';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import OpenAI from 'openai';

export type ExecuteOperation = (
  operationName: string,
  params: unknown,
) => Promise<string>;

export type ConversationHistory = {
  id: string;
  model: string;
  title: string;
  conversation: ChatCompletionMessageParam[];
  lastSaved: number;
};

export type AppContextType = {
  errorText: string;
  setErrorText: React.Dispatch<React.SetStateAction<string>>;
  isReady: boolean;
  setIsReady: React.Dispatch<React.SetStateAction<boolean>>;
  isRequesting: boolean;
  setIsRequesting: React.Dispatch<React.SetStateAction<boolean>>;
  registry: OperationRegistry<unknown>;
  modelConfig: ModelConfig;
  handleModelChange: (modelName: SupportedModels) => void;
  executeOperation: ExecuteOperation;
  loadConversation: (convoHistory: ConversationHistory) => void;
  handleReset: () => void;
  handleChatCompletion: (value: string) => void;
  handleCancel: () => void;
  walletStore: WalletStore;
  client: OpenAI | null;
  thinkingStore: TextStreamStore;
  messageStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
  isOperationValidated: boolean;
  loadConversation: (convoHistory: ConversationHistory) => void;
  conversations: ConversationHistory[];
  hasConversations: boolean;
};
