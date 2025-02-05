import { ChatCompletionMessageParam } from 'openai/resources/index';

export interface IStorage<T> {
  write(state: T): Promise<void>;

  load(): Promise<T>;

  reset(): Promise<void>;
}

export type ChatHistory = {
  messages: Array<ChatCompletionMessageParam>;
};
