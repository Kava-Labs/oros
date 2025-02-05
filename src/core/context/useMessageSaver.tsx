import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { ModelConfig, SupportedModels } from '../types/models';
import type { ChatCompletionMessageParam } from 'openai/resources/index';

export type ConversationHistory = {
  modelName: SupportedModels;
  title: string;
  conversation: ChatCompletionMessageParam[];
};

export const useMessageSaver = (
  messageHistoryStore: MessageHistoryStore,
  modelConfig: ModelConfig,
) => {};
