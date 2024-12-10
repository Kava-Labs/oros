export interface IStorage<T> {
  write(state: T): Promise<void>;

  load(): Promise<T>;

  reset(): Promise<void>;
}

export type ChatHistory = {
  messages: string[];
};
