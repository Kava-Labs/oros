import { useSyncExternalStore } from 'react';
import { streamingMessageStore as streamingMessageStore } from './streamingMessageStore';

export const useStreamingMessageStore = (store = streamingMessageStore) => {
  const state: string = useSyncExternalStore(store.subscribe, store.getCurrent);
  return [state, store.setValue] as const;
};
