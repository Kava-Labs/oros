import { useEffect, useRef } from 'react';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { ConversationHistory } from './types';
import OpenAI from 'openai';
import { formatConversationTitle } from '../utils/conversation/helpers';

const PLACEHOLDER_CHAT_TITLE = 'New Chat';

export const useMessageSaver = (
  messageHistoryStore: MessageHistoryStore,
  modelID: string,
  client: OpenAI,
) => {
  const prevMessageCountRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const onChange = async () => {
      const messages = messageHistoryStore.getSnapshot();
      const id = messageHistoryStore.getConversationID();
      const allConversations: Record<string, ConversationHistory> = JSON.parse(
        localStorage.getItem('conversations') ?? '{}',
      );

      // Handle initial system message - save with placeholder
      if (
        messages.length === 1 &&
        messages[0].role === 'system' &&
        !allConversations[id]
      ) {
        // Clean up any existing empty placeholder chats
        Object.entries(allConversations).forEach(([convId, conv]) => {
          if (
            conv.title === PLACEHOLDER_CHAT_TITLE &&
            conv.conversation.length === 1
          ) {
            delete allConversations[convId];
          }
        });
        const history: ConversationHistory = {
          id,
          model: modelID,
          title: PLACEHOLDER_CHAT_TITLE,
          conversation: messages,
          lastSaved: new Date().valueOf(),
        };
        allConversations[id] = history;
        localStorage.setItem('conversations', JSON.stringify(allConversations));
        return;
      }

      // Clean up empty conversations with placeholder title
      if (
        messages.length === 1 &&
        allConversations[id] &&
        allConversations[id].title === PLACEHOLDER_CHAT_TITLE
      ) {
        delete allConversations[id];
        localStorage.setItem('conversations', JSON.stringify(allConversations));
        return;
      }

      if (messages.length >= 3) {
        const firstUserMessage = messages.find((msg) => msg.role === 'user');
        if (!firstUserMessage) return;

        const existingConversation = allConversations[id];
        if (!prevMessageCountRef.current[id]) {
          prevMessageCountRef.current[id] = existingConversation
            ? existingConversation.conversation.length
            : messages.length;
        }

        const hasNewMessages =
          existingConversation &&
          messages.length > prevMessageCountRef.current[id];
        prevMessageCountRef.current[id] = messages.length;

        const lastSaved = hasNewMessages
          ? new Date().valueOf()
          : (existingConversation?.lastSaved ?? new Date().valueOf());

        const history: ConversationHistory = {
          id,
          model: existingConversation?.model ?? modelID,
          title: firstUserMessage.content as string,
          conversation: messages,
          lastSaved,
        };

        // Generate title for new conversations or those with placeholder title
        if (
          !existingConversation ||
          existingConversation.title === PLACEHOLDER_CHAT_TITLE
        ) {
          try {
            const data = await client.chat.completions.create({
              stream: false,
              messages: [
                {
                  role: 'system',
                  content: 'Generate a 3-4 word conversation title.',
                },
                {
                  role: 'user',
                  content: `Title suggestion for:
                ${messages.map((msg) => `Role: ${msg.role} ${msg.content}`).join('\n')}`,
                },
              ],
              model: 'gpt-4o-mini',
            });
            history.title = formatConversationTitle(
              data.choices[0]?.message?.content ??
                (firstUserMessage.content as string),
              34,
            );
          } catch {
            history.title = firstUserMessage.content as string;
          }
        } else {
          history.title = existingConversation.title;
        }

        allConversations[id] = history;
        localStorage.setItem('conversations', JSON.stringify(allConversations));
      }
    };

    const unsubscribe = messageHistoryStore.subscribe(onChange);
    return () => unsubscribe();
  }, [messageHistoryStore, modelID, client]);
};
