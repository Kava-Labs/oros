import { TextStreamStore } from './textStreamStore';

export const messageStore = new TextStreamStore();
export const progressStore = new TextStreamStore();
export const errorStore = new TextStreamStore();
