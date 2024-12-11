import { LocalStorage } from '.';
import { ChatHistory } from './types';

//  we can initialize as either an 'empty record' or null
//  and will reset to that value
const defaultStates: Array<ChatHistory | null> = [{ messages: [] }, null];

describe('LocalStorage', () => {
  it('load, write, remove for ChatHistory', async () => {
    for await (const defaultState of defaultStates) {
      const store = new LocalStorage<typeof defaultState>(
        'chat-messages',
        defaultState,
      );

      let currentState = await store.load();

      expect(currentState).toStrictEqual(defaultState);

      const updatedState: ChatHistory = {
        messages: [
          {
            role: 'user',
            content: 'Hello there!',
          },
        ],
      };

      await store.write(updatedState);

      currentState = await store.load();
      expect(currentState).toStrictEqual(updatedState);

      const additionallyUpdatedState: ChatHistory = {
        messages: [
          ...updatedState.messages,
          {
            role: 'assistant',
            content: 'Hi - how can I help you?',
          },
        ],
      };

      await store.write(additionallyUpdatedState);
      currentState = await store.load();

      expect(currentState).toStrictEqual(additionallyUpdatedState);

      await store.reset();

      currentState = await store.load();
      expect(currentState).toStrictEqual(defaultState);
    }
  });
  it('write error is handled', async () => {
    const store = new LocalStorage<ChatHistory>('chat-messages', {
      messages: [],
    });

    // Load initial state
    await store.load();

    // Define a state that exceeds localStorage quota
    const updatedState: ChatHistory = {
      messages: [
        {
          role: 'user',
          content: 'x'.repeat(10 * 1024 * 1024), // Large content to exceed quota
        },
      ],
    };

    // Attempt to write and expect an error
    await expect(store.write(updatedState)).rejects.toThrow(
      'Error while writing state: "The 5000000-code unit storage quota has been exceeded."',
    );
  });
});
