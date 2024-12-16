type Listener = () => void;

class MessageStore {
  private currentMessage: string = '';
  private listeners: Set<Listener> = new Set();

  public setMessage = (message: string) => {
    this.currentMessage = message;
    this.emitChange();
  };

  public updateMessage = (delta: string) => {
    this.currentMessage += delta;
    this.emitChange();
  };

  public getSnapshot = (): string => {
    return this.currentMessage;
  };

  // Note: Callbacks must always be unique per listener
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

export const messageStore = new MessageStore();
