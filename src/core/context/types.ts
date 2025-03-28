import { TextStreamStore } from '../../core/stores/textStreamStore';
import { MessageHistoryStore } from '../../core/stores/messageHistoryStore';
import { ModelConfig, SupportedModels } from '../types/models';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import OpenAI from 'openai';

export type ConversationHistory = {
  id: string;
  model: string;
  title: string;
  conversation: ChatCompletionMessageParam[];
  lastSaved: number;
  tokensRemaining: number;
};

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
  loadConversation: (convoHistory: ConversationHistory) => void;
  conversations: ConversationHistory[];
  hasConversations: boolean;
};

export interface TextChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}
