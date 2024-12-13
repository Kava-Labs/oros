import { createStore, StateStore } from '../createStore';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { systemPrompt } from '../../config';

export type MessageHistoryStore = StateStore<ChatCompletionMessageParam[]>;

export const messageHistoryStore : MessageHistoryStore = createStore<ChatCompletionMessageParam[]>([
  {
    role: 'system',
    content: systemPrompt,
  },
]);
