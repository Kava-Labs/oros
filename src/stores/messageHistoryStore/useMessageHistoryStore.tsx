import { useSyncExternalStore } from 'react';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { messageHistoryStore } from './messageHistoryStore';

export const useMessageHistoryStore = (store = messageHistoryStore) => {
  const state: ChatCompletionMessageParam[] = useSyncExternalStore(
    store.subscribe,
    store.getState,
  );

  return [state, store.setState] as const;
};
