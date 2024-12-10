import { MemoryStorage } from './index.ts';

type ChatHistory = {
  messages: string[];
};

describe('LStorage', () => {
  it('load, write, remove for ChatHistory', async () => {
    //  we can initialize as either an 'empty record' or null
    //  and will reset to that value
    const defaultStates: Array<ChatHistory | null> = [{ messages: [] }, null];

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
