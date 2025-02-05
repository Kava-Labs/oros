import { useEffect } from 'react';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import type { ChatCompletionMessageParam } from 'openai/resources/index';

export type ConversationHistory = {
  id: string;
  modelName: string;
  title: string;
  conversation: ChatCompletionMessageParam[];
  lastSaved: number;
};

export const useMessageSaver = (
  messageHistoryStore: MessageHistoryStore,
  modelName: string,
) => {
  useEffect(() => {
    const onChange = () => {
      const messages = messageHistoryStore.getSnapshot();
      const id = messageHistoryStore.getConversationID();
      if (messages.length >= 3) {
        const firstUserMessage = messages.find((msg) => msg.role === 'user');
        if (!firstUserMessage) return;
        const { content } = firstUserMessage;

        const history: ConversationHistory = {
          id,
          modelName,
          title: content as string,
          conversation: messages,
          lastSaved: new Date().valueOf(),
        };

        localStorage.setItem(id, JSON.stringify(history));
      }
    };

    // subscribe to the store within the useEffect instead of using useSyncExternalStore
    // this is to prevent re-renders of the caller using this hook
    const unsubscribe = messageHistoryStore.subscribe(onChange);
    return () => unsubscribe();
  }, [messageHistoryStore, modelName]);
};
