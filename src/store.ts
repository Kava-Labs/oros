import { TextStreamStore } from './textStreamStore';
import { ToolCallStreamStore } from './toolCallStreamStore';
import { MessageHistoryStore } from './messageHistoryStore';

export const messageStore = new TextStreamStore();
export const progressStore = new TextStreamStore();
export const toolCallStreamStore = new ToolCallStreamStore();
export const messageHistoryStore = new MessageHistoryStore();
