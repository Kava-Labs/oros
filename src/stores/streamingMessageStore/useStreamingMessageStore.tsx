import { useSyncExternalStore } from 'react';
import { streamingMessageStore as streamingMessageStore } from './streamingMessageStore';

export const useStreamingMessageStore = (store = streamingMessageStore) => {
  const state: string = useSyncExternalStore(store.subscribe, store.getState);
  return [state, store.setState] as const;
};
