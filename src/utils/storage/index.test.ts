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

    //  update and reinitialize
    await store.write({messages: ['testMessage']});
    currentState = await store.load();

    expect(currentState?.messages).toStrictEqual(['testMessage']);

    await store.remove();

    currentState = await store.load();

    expect(currentState).toBeNull();
  });
})
