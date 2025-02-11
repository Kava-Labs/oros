import { useEffect } from 'react';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { ConversationHistory } from './types';
import OpenAI from 'openai';

export const useMessageSaver = (
  messageHistoryStore: MessageHistoryStore,
  modelID: string,
  client: OpenAI,
) => {
  useEffect(() => {
    const onChange = async () => {
      const messages = messageHistoryStore.getSnapshot();
      const id = messageHistoryStore.getConversationID();
      if (messages.length >= 3) {
        const firstUserMessage = messages.find((msg) => msg.role === 'user');
        if (!firstUserMessage) return;
        const { content } = firstUserMessage;

        const allConversations: Record<string, ConversationHistory> =
          JSON.parse(localStorage.getItem('conversations') ?? '{}');

        const history: ConversationHistory = {
          id,
          model: allConversations[id] ? allConversations[id].model : modelID,
          title: content as string, // fallback value
          conversation: messages,
          lastSaved: new Date().valueOf(),
        };

        if (!allConversations[id]) {
          try {
            const data = await client.chat.completions.create({
              stream: false,
              messages: [
                {
                  role: 'system',
                  content:
                    'your task is to generate a title for a conversation using 4 to 5 words',
                },
                {
                  role: 'user',
                  content: `Please generate a title for this conversation (max 5 words):
                  ${messages.map((msg) => {
                    // only keep user/assistant messages
                    if (msg.role !== 'user' && msg.role !== 'assistant') return;

                    return `Role: ${msg.role} 
                                  ${msg.content}
                    `;
                  })}
                  `,
                },
              ],
              model: 'gpt-4o-mini',
            });

            history.title =
              data.choices[0].message.content ?? (content as string);
          } catch (err) {
            history.title = content as string;
            console.error(err);
          }
        } else {
          // keep the generated title
          history.title = allConversations[id].title;
        }

        allConversations[id] = history;
        localStorage.setItem('conversations', JSON.stringify(allConversations));
      }
    };

    // subscribe to the store within the useEffect instead of using useSyncExternalStore
    // this is to prevent re-renders of the caller using this hook
    const unsubscribe = messageHistoryStore.subscribe(onChange);
    return () => unsubscribe();
  }, [messageHistoryStore, modelID, client]);
};
