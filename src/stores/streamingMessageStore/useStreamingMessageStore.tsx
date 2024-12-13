import { useSyncExternalStore } from 'react';
import type { StreamingMessageStore } from './streamingMessageStore';

export const useStreamingMessageStore = (store: StreamingMessageStore) => {
  const state: string = useSyncExternalStore(store.subscribe, store.getState);
  return [state, store.setState] as const;
};
