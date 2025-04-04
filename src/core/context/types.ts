import {
  ConversationHistories,
  TextStreamStore,
  SearchableChatHistories,
} from 'lib-kava-ai';
import { MessageHistoryStore } from '../../core/stores/messageHistoryStore';
import { ModelConfig, SupportedModels } from '../types/models';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import OpenAI from 'openai';

export type ActiveConversation = {
  conversationID: string;
  messageStore: TextStreamStore;
  progressStore: TextStreamStore;
  thinkingStore: TextStreamStore;
  errorStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
  isRequesting: boolean;
};

export type AppContextType = {
  conversationID: string;
  isReady: boolean;
  isRequesting: boolean;
  modelConfig: ModelConfig;
  handleModelChange: (modelName: SupportedModels) => void;
  startNewChat: () => void;
  handleChatCompletion: (value: ChatCompletionMessageParam[]) => void;
  handleCancel: () => void;
  client: OpenAI | null;
  thinkingStore: TextStreamStore;
  messageStore: TextStreamStore;
  errorStore: TextStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
  onSelectConversation: (id: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  onUpdateConversationTitle: (id: string, newTitle: string) => Promise<void>;
  fetchSearchHistory: () => Promise<void>;
  searchableHistory: SearchableChatHistories | null;
  conversations: ConversationHistories;
};

export interface TextChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}
