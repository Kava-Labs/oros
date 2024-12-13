import { createStore } from '../createStore';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { systemPrompt } from '../../config';

export const messageHistoryStore = createStore<ChatCompletionMessageParam[]>([
  {
    role: 'system',
    content: systemPrompt,
  },
]);
