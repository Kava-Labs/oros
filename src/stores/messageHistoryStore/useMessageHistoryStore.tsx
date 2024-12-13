import { useSyncExternalStore } from 'react';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { MessageHistoryStore } from './messageHistoryStore';

export const useMessageHistoryStore = (store: MessageHistoryStore) => {
  const state: ChatCompletionMessageParam[] = useSyncExternalStore(
    store.subscribe,
    store.getState,
  );

  return [state, store.setState] as const;
};
