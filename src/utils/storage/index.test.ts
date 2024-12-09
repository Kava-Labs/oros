import { LStorage } from './index.ts';

type ChatHistory = {
  messages: string[];
}

describe('LocalStorage', () => {
  it('load calls "getItem" once with correct key', async () => {
    const store = new LStorage<ChatHistory>();

    let currentState = await store.load();

    //  State initializes as null
    expect(currentState).toBeNull();

    //  update and reinitialize
    await store.write({messages: ['testMessage']});
    currentState = await store.load();

    expect(currentState?.messages).toStrictEqual(['testMessage']);

    await store.remove();

    currentState = await store.load();

    expect(currentState).toBeNull();
  });
})
