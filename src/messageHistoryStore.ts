import type { ChatCompletionMessageParam } from 'openai/resources/index';

type Listener = () => void;

export class MessageHistoryStore {
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
