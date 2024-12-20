import { TextStreamStore } from './textStreamStore';
import { ToolCallStreamStore } from './toolCallStreamStore';

export const messageStore = new TextStreamStore();
export const progressStore = new TextStreamStore();
export const toolCallStreamStore = new ToolCallStreamStore();
