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

export class LocalStorage<T> implements IStorage<T> {
  private key: string;
  private defaultState: T;

  constructor(key: string, defaultState: T) {
    this.key = key;
    this.defaultState = defaultState;
  }

  async write(message: T) {
    localStorage.setItem(this.key, JSON.stringify(message));
  }

  async load() {
    const data = localStorage.getItem(this.key);

    if (data !== null) {
      return JSON.parse(data) as T;
    } else {
      return this.defaultState as T;
    }
  }

  async reset() {
    localStorage.removeItem(this.key);
  }
}
