import { TextStreamStore } from './textStreamStore';
import { ToolCallStore } from './toolCallStore';

export const messageStore = new TextStreamStore();
export const progressStore = new TextStreamStore();
export const toolCallStore = new ToolCallStore();
