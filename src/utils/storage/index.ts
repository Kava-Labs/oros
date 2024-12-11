import { IStorage } from './types';

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
      console.log('in else');
      return this.defaultState as T;
    }
  }

  async reset() {
    localStorage.removeItem(this.key);
  }
}
