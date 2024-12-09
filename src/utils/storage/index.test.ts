import { LStorage } from './index.ts';

type ChatHistory = {
  messages: string[];
}

describe('LStorage', () => {
  it('load, write, remove for ChatHistory', async () => {
    const store = new LStorage<ChatHistory>();

    let currentState = await store.load();

    //  State initializes as null
    expect(currentState).toBeNull();

    //  add and reinitialize
    const updatedState: ChatHistory = {
      messages: ['testMessage']
    };

    await store.write(updatedState);

    currentState = await store.load();
    expect(currentState).toStrictEqual(updatedState);

    //  clear and reinitialize
    await store.remove();

    currentState = await store.load();
    expect(currentState).toBeNull();
  });
})
