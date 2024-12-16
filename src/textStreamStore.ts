type Listener = () => void;

export class TextStreamStore {
  private currentValue: string = '';
  private listeners: Set<Listener> = new Set();

  public setText = (value: string) => {
    this.currentValue = value;
    this.emitChange();
  };

  public appendText = (chunk: string) => {
    this.currentValue += chunk;
    this.emitChange();
  };

  public getSnapshot = (): string => {
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
