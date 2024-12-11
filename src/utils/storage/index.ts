import { IStorage } from './types';
import { toast } from 'react-toastify';

export class LocalStorage<T> implements IStorage<T> {
  private key: string;
  private defaultState: T;

  constructor(key: string, defaultState: T) {
    this.key = key;
    this.defaultState = defaultState;
  }

  async write(state: T) {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch (e: unknown) {
      toast.error(JSON.stringify(e));
    }
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
