export interface IStorage<T> {
  write(state: T): Promise<void>;

  load(): Promise<T | null>;

  remove(): Promise<void>;
}

export class LStorage<T> implements IStorage<T> {
  private state: T | null = null;

  async write(state: T): Promise<void> {
    this.state = state;
  }

  async load(): Promise<T | null> {
    return this.state;
  }

  async remove(): Promise<void> {
    this.state = null;
  }
}

