import { createStore, StateStore } from '../createStore';

export type StreamingMessageStore = StateStore<string>;

export const streamingMessageStore : StreamingMessageStore = createStore<string>('');

