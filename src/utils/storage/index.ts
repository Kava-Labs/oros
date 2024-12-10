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

  async write(data: T): Promise<void> {
    return new Promise<void>((resolve) => {
      localStorage.setItem(this.key, JSON.stringify(data));
      resolve();
    });
  }

  async load(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      console.log({ localStorage });
      const data = localStorage.getItem(this.key);
      if (data !== null) {
        resolve(JSON.parse(data) as T);
      } else {
        reject(new Error(`No data found for key: ${this.key}`));
      }
    });
  }

  async reset(): Promise<void> {
    return new Promise<void>((resolve) => {
      localStorage.setItem(this.key, JSON.stringify(this.defaultState));
      resolve();
    });
  }
}
