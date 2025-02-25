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
<<<<<<< HEAD
<<<<<<< HEAD
  tokensRemaining: number;
=======
  tokensRemaining?: number;
>>>>>>> a511208 (feat: estimate deepseek remaining tokens and store on conversation)
=======
  tokensRemaining: number;
>>>>>>> 69aa1d7 (refactor: remove snake case for camel case)
};

export type ActiveConversation = {
  conversationID: string;
  messageStore: TextStreamStore;
  progressStore: TextStreamStore;
  thinkingStore: TextStreamStore;
  errorStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
  toolCallStreamStore: ToolCallStreamStore;
  isRequesting: boolean;
};

export type AppContextType = {
  conversationID: string;
  isReady: boolean;
  isRequesting: boolean;
  registry: OperationRegistry<unknown>;
  modelConfig: ModelConfig;
  handleModelChange: (modelName: SupportedModels) => void;
  startNewChat: () => void;
  executeOperation: ExecuteOperation;
  handleReset: () => void;
  handleChatCompletion: (value: string) => void;
  handleCancel: () => void;
  walletStore: WalletStore;
  client: OpenAI | null;
  thinkingStore: TextStreamStore;
  messageStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  errorStore: TextStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
  isOperationValidated: boolean;
  loadConversation: (convoHistory: ConversationHistory) => void;
  conversations: ConversationHistory[];
  hasConversations: boolean;
};

export interface TextChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}
