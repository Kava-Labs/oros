export interface IStorage<T> {
  write(state: T): Promise<void>;

  load(): Promise<T>;

  reset(): Promise<void>;
}

type ChatHistoryEntry = {
  role: 'user' | 'system' | 'assistant';
  content: string;
};

export type ChatHistory = {
  messages: Array<ChatHistoryEntry>;
};
