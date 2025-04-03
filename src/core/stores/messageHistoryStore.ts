import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/index';
type Listener = () => void;

export interface ReasoningAssistantMessage {
  role: 'assistant';
  content: string;
  reasoningContent?: string;
}

export type ChatMessage =
  | ChatCompletionMessageParam
  | ChatCompletionToolMessageParam
  | ChatCompletionAssistantMessageParam
  | ReasoningAssistantMessage;

export class MessageHistoryStore {
  private currentValue: ChatMessage[] = [];
  private listeners: Set<Listener> = new Set();

  public hasUserMessages(): boolean {
    return (
      this.currentValue.filter((message) => message.role !== 'system').length >
      0
    );
  }

  public addMessage(msg: ChatMessage) {
    const newMessages = [...this.currentValue, msg];
    this.currentValue = newMessages;
    this.emitChange();
  }

  public setMessages(msgs: ChatMessage[]) {
    if (msgs !== this.currentValue) {
      this.currentValue = msgs;
      this.emitChange();
    }
  }

  public getSnapshot = () => {
    return this.currentValue;
  };

  public loadConversation = (messages: ChatMessage[]) => {
    this.currentValue = messages;
    this.emitChange();
  };

  public reset() {
    this.currentValue = [];
    this.emitChange();
  }

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
