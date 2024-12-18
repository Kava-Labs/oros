import type { ChatCompletionChunk } from 'openai/resources/index';

type Listener = () => void;

export type ToolCall = ChatCompletionChunk.Choice.Delta.ToolCall;

export class ToolCallStore {
  private currentValue: ToolCall[] = [];
  private listeners: Set<Listener> = new Set();

  public setToolCalls = (value: ToolCall[]) => {
    if (this.currentValue !== value) {
      this.currentValue = value;
      this.emitChange();
    }
  };

  public pushToolCall = (toolCall: ToolCall) => {
    this.currentValue = [...this.currentValue, toolCall];
    this.emitChange();
  };

  public getSnapshot = (): ToolCall[] => {
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
