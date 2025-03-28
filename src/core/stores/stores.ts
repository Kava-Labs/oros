import { MessageHistoryStore } from './messageHistoryStore';
import { TextStreamStore } from './textStreamStore';

export const messageStore = new TextStreamStore();
export const thinkingStore = new TextStreamStore();
export const progressStore = new TextStreamStore();
export const errorStore = new TextStreamStore();
export const messageHistoryStore = new MessageHistoryStore();
