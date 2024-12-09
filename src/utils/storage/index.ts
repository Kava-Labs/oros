export interface IStorage<T> {
  write(state: T): Promise<void>;
  load(): Promise<T>;
  remove(): Promise<void>;
}

export class LStorage<T> implements IStorage<T> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  //  todo
  async write(state: T): Promise<void> {
    return new Promise<void>(() => {
      console.log('write', state)
    });
  }

  //  todo - handle reject
  async load(): Promise<T> {
    return new Promise<T>((resolve) => {
      resolve(localStorage.getItem(this.key) as T)
    })
  }

  //  todo
  async remove(): Promise<void> {
    return new Promise<void>(() => {
      console.log('remove');
    })
  }
}
