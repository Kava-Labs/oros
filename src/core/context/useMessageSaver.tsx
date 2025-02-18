import { useEffect, useRef } from 'react';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { ConversationHistory } from './types';
import OpenAI from 'openai';
import {
  formatConversationTitle,
  isMostRecentConversation,
} from '../utils/conversation/helpers';

export const useMessageSaver = (
  messageHistoryStore: MessageHistoryStore,
  modelID: string,
  client: OpenAI,
) => {
  // Keep track of the conversation length to detect new messages
  const prevMessageCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const onChange = async () => {
      const allConversations: Record<string, ConversationHistory> = JSON.parse(
        localStorage.getItem('conversations') ?? '{}',
      );

      const id = messageHistoryStore.getConversationID();

      // Check if this is an existing conversation
      const existingConversation = allConversations[id];

      const messages = messageHistoryStore.getSnapshot();

      //  When a user adds a message (after the initial system prompt),
      //  update the title to the placeholder to handle if the user cancels the stream
      //  and to have a placeholder while reasoning streaming completes
      const isNewConversation = !existingConversation && messages.length === 2;
      if (isNewConversation) {
        allConversations[id] = {
          id,
          model: modelID,
          title: 'New Chat',
          conversation: messages,
          lastSaved: new Date().valueOf(),
        };
        localStorage.setItem('conversations', JSON.stringify(allConversations));
      }

      if (messages.length >= 3) {
        const firstUserMessage = messages.find((msg) => msg.role === 'user');
        if (!firstUserMessage) return;
        const { content } = firstUserMessage;

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

        //  we want to check both the title and the length of the conversation
        //  we shouldn't prevent a user from renaming to the placeholder
        //  also, this should only ever apply to the most recent conversation
        const isPlaceholderHistoryTitle =
          existingConversation &&
          existingConversation.title === 'New Chat' &&
          existingConversation.conversation.length === 2 &&
          isMostRecentConversation(allConversations, id);

        if (!existingConversation || isPlaceholderHistoryTitle) {
          try {
            const data = await client.chat.completions.create({
              stream: false,
              messages: [
                {
                  role: 'system',
                  content:
                    'your task is to generate a title for a conversation using 3 to 4 words',
                },
                {
                  role: 'user',
                  content: `Please generate a title for this conversation (max 4 words):
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

            // Apply truncation only when we get the AI-generated title
            const generatedTitle =
              data.choices[0].message.content ?? (content as string);
            history.title = formatConversationTitle(generatedTitle, 34);
          } catch (err) {
            history.title = content as string;
            console.error(err);
          }
        } else {
          // keep the existing title without any truncation
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
