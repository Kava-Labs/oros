import { IStorage } from './types';

export class MemoryStorage<T> implements IStorage<T> {
  private state: T;
  private readonly defaultState: T;

  constructor(state: T) {
    this.state = state;
    this.defaultState = state;
  }

  async write(state: T): Promise<void> {
    this.state = state;
  }

  async load(): Promise<T> {
    return this.state;
  }

  async reset(): Promise<void> {
    this.state = this.defaultState;
  }
}
