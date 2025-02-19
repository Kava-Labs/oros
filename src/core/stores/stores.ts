import { MessageHistoryStore } from './messageHistoryStore';
import { TextStreamStore } from './textStreamStore';
import { ToolCallStreamStore } from './toolCallStreamStore';
import { WalletStore } from '../../features/blockchain/stores/walletStore';

export const messageStore = new TextStreamStore();
export const thinkingStore = new TextStreamStore();
export const progressStore = new TextStreamStore();
export const errorStore = new TextStreamStore();
export const toolCallStreamStore = new ToolCallStreamStore();
export const messageHistoryStore = new MessageHistoryStore();
export const walletStore = new WalletStore();
