import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { v4 as uuidv4 } from 'uuid';
import { ConversationHistory } from '../context/types';
type Listener = () => void;

export class MessageHistoryStore {
  private id: string = '';
  private currentValue: ChatCompletionMessageParam[] = [];
  private listeners: Set<Listener> = new Set();

  public addMessage(msg: ChatCompletionMessageParam) {
    const newMessages = [...this.currentValue, msg];
    this.currentValue = newMessages;
    this.emitChange();
  }

  public setMessages(msgs: ChatCompletionMessageParam[]) {
    if (msgs !== this.currentValue) {
      this.currentValue = msgs;
      this.emitChange();
    }
  }

  public getSnapshot = () => {
    return this.currentValue;
  };

  public getConversationID = () => {
    if (!this.id.length) this.id = uuidv4(); // generate uuid if not exists
    return this.id;
  };

  public loadConversation = (conversationHistory: ConversationHistory) => {
    this.id = conversationHistory.id;
    this.currentValue = conversationHistory.conversation;
    this.emitChange();
  };

  public subscribe = (callback: Listener): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
