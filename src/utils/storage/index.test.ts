import { LocalStorage, MemoryStorage } from '.';
import { ChatHistory } from './types';

//  we can initialize as either an 'empty record' or null
//  and will reset to that value
const defaultStates: Array<ChatHistory | null> = [{ messages: [] }, null];

describe('MemoryStorage', () => {
  it('load, write, remove for ChatHistory', async () => {
    for await (const defaultState of defaultStates) {
      const store = new MemoryStorage<typeof defaultState>(defaultState);

      let currentState = await store.load();

      //  State initializes
      expect(currentState).toStrictEqual(defaultState);

      //  add a new entry
      const updatedState: ChatHistory = {
        messages: ['testMessage'],
      };

      await store.write(updatedState);

      //  reload and see the update
      currentState = await store.load();
      expect(currentState).toStrictEqual(updatedState);

      //  reset
      await store.reset();

      //  reload to default
      currentState = await store.load();
      expect(currentState).toStrictEqual(defaultState);
    }
  });
});

describe('LocalStorage', () => {
  it('load, write, remove for ChatHistory', async () => {
    for await (const defaultState of defaultStates) {
      localStorage.setItem('chat-messages', JSON.stringify(defaultState));

      const store = new LocalStorage<typeof defaultState>(
        'chat-messages',
        defaultState,
      );

      let currentState = await store.load();

      expect(currentState).toStrictEqual(defaultState);

      const updatedState: ChatHistory = {
        messages: ['Hello world'],
      };

      await store.write(updatedState);

      currentState = await store.load();
      expect(currentState).toStrictEqual(updatedState);

      await store.reset();

      currentState = await store.load();
      expect(currentState).toStrictEqual(defaultState);
    }
  });
});
