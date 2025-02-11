import { useEffect, useRef } from 'react';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { ConversationHistory } from './types';
import OpenAI from 'openai';

export const useMessageSaver = (
  messageHistoryStore: MessageHistoryStore,
  modelID: string,
  client: OpenAI,
) => {
  // Keep track of the conversation length to detect new messages
  const prevMessageCountRef = useRef<Record<string, number>>({});

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

        // Check if this is an existing conversation
        const existingConversation = allConversations[id];

        // Initialize message count for this conversation if it doesn't exist
        if (!prevMessageCountRef.current[id]) {
          prevMessageCountRef.current[id] = existingConversation
            ? existingConversation.conversation.length
            : messages.length;
        }

        // Determine if new messages were added to an existing conversation
        const hasNewMessages =
          existingConversation &&
          messages.length > prevMessageCountRef.current[id];

        // Update the message count reference
        prevMessageCountRef.current[id] = messages.length;

        // Only update lastSaved if new messages were added to an existing conversation
        const lastSaved = hasNewMessages
          ? new Date().valueOf()
          : (existingConversation?.lastSaved ?? new Date().valueOf());

        const history: ConversationHistory = {
          id,
          model: existingConversation ? existingConversation.model : modelID,
          title: content as string, // fallback value
          conversation: messages,
          lastSaved,
        };

        if (!existingConversation) {
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
