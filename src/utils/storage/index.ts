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

  async load(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      try {
        const item = localStorage.getItem(this.key);

        if (item) {
          resolve(item as T);
        } else {
          reject(`${this.key} not found in storage`);

        }
      } catch (error) {
        reject(error);
      }
    });
  }

  //  todo
  async remove(): Promise<void> {
    return new Promise<void>(() => {
      console.log('remove');
    })
  }
}
