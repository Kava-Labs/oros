import { ConversationHistory } from '../../context/types';
import { extractTextContent, getTimeGroup } from 'lib-kava-ai';

export type GroupedConversations = Record<string, ConversationHistory[]>;

/**
 * Groups an array of conversations by time periods and sorts them by timestamp
 * @param conversations - Array of conversation histories
 * @returns An object with time period keys and arrays of conversations as values
 */
export const groupConversationsByTime = (
  conversations: ConversationHistory[],
): GroupedConversations => {
  return conversations
    .sort((a, b) => b.lastSaved - a.lastSaved)
    .reduce((groups, conversation) => {
      const timeGroup = getTimeGroup(conversation.lastSaved);
      if (!groups[timeGroup]) {
        groups[timeGroup] = [];
      }
      groups[timeGroup].push(conversation);
      return groups;
    }, {} as GroupedConversations);
};

/**
 * Groups and filters conversations based on search term
 * @param conversations Array of conversations to process
 * @param searchTerm Optional term to filter by
 * @returns Time-grouped conversations, filtered by search term if provided
 */
export const groupAndFilterConversations = (
  conversations: ConversationHistory[],
  searchTerm = '',
): GroupedConversations => {
  if (!searchTerm) {
    return groupConversationsByTime(conversations);
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  const filteredConversations = conversations.filter((conv) => {
    const messages = removeSystemMessages(conv);

    return (
      conv.title.toLowerCase().includes(lowerSearchTerm) ||
      messages.some((msg) => {
        const textContent = extractTextContent(msg);
        return textContent.toLowerCase().includes(lowerSearchTerm);
      })
    );
  });

  return groupConversationsByTime(filteredConversations);
};

/**
 * Formats a snippet of conversation content based on search criteria or defaults to first user message
 * @param {ConversationHistory} conversation - The conversation history object to extract content from
 * @param {string} [searchTerm=''] - Optional search term to find matching content
 * @returns {string} A snippet of up to 100 characters that either:
 * - Shows up to 3 words before the matching search term and the content after it
 * - Shows first user message if search term is empty or only matches the title
 * - Returns empty string if no content is found
 */
export const formatContentSnippet = (
  conversation: ConversationHistory,
  searchTerm: string = '',
): string => {
  const messages = removeSystemMessages(conversation);

  if (searchTerm) {
    const matchingMessage = messages.find((msg) => {
      const textContent = extractTextContent(msg);
      return textContent.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (matchingMessage) {
      const content = extractTextContent(matchingMessage);
      const searchIndex = content
        .toLowerCase()
        .indexOf(searchTerm.toLowerCase());

      //  Find start of snippet considering up to 3 words before match
      let snippetStart = searchIndex;
      if (searchIndex > 0) {
        const beforeMatch = content.slice(0, searchIndex).trim();
        const precedingWords = beforeMatch.split(' ').slice(-3);
        snippetStart = searchIndex - (precedingWords.join(' ').length + 1);
        if (snippetStart < 0) snippetStart = 0;
      }

      return content.slice(snippetStart, snippetStart + 100).trim();
    }
  }

  const firstUserMessage = messages.find((msg) => msg.role === 'user');
  if (firstUserMessage) {
    const content = extractTextContent(firstUserMessage);
    return content.slice(0, 100);
  }

  return '';
};

/**
 * Removes the system prompt from the conversation array since we don't include that when searching
 */
const removeSystemMessages = (conversationHistory: ConversationHistory) => {
  return conversationHistory.conversation.filter(
    (msg) => msg.role !== 'system',
  );
};
