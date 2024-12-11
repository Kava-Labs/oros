import { IStorage } from './types';

export class LocalStorage<T> implements IStorage<T> {
  constructor(
    private key: string,
    private defaultState: T,
  ) {}

  async write(state: T) {
    localStorage.setItem(this.key, JSON.stringify(state));
  }

  async load() {
    const data = localStorage.getItem(this.key);

    if (data === null) {
      return this.defaultState;
    }
    return JSON.parse(data) as T;
  }

  async reset() {
    localStorage.removeItem(this.key);
  }
}
