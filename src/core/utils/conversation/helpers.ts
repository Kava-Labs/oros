import { ConversationHistory, TextChatMessage } from '../../context/types';
import { encodeChat } from 'gpt-tokenizer';
import { ContextMetrics } from '../../types/models';
import { ChatMessage } from '../../stores/messageHistoryStore';
import { MODEL_REGISTRY } from '../../config';

/**
 * Formats a conversation title by removing surrounding quotes and truncating if necessary
 * @param title - The original conversation title
 * @param maxLength - Maximum length before truncation (not including ellipsis)
 * @returns Formatted title with quotes removed and truncated if longer than maxLength
 * @example
 * // Returns "Hello World"
 * formatConversationTitle('"Hello World"', 20)
 *
 * // Returns "This is a very lo...."
 * formatConversationTitle("This is a very long title", 15)
 */
export const formatConversationTitle = (title: string, maxLength: number) => {
  let formattedTitle = title;

  // Remove quotes from beginning and end
  if (formattedTitle.startsWith(`"`) || formattedTitle.startsWith(`'`)) {
    formattedTitle = formattedTitle.slice(1);
  }
  if (formattedTitle.endsWith(`"`) || formattedTitle.endsWith(`'`)) {
    formattedTitle = formattedTitle.slice(0, -1);
  }

  if (formattedTitle.length > maxLength) {
    formattedTitle = formattedTitle.slice(0, maxLength) + '....';
  }

  return formattedTitle;
};

/**
 * Determines the time group label for a given timestamp
 * @param timestamp - Unix timestamp in milliseconds
 * @returns A string representing the time group (e.g., 'Today', 'Yesterday', 'Last week')
 */
export const getTimeGroup = (timestamp: number): string => {
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - timestamp) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last week';
  if (diffDays <= 14) return '2 weeks ago';
  if (diffDays <= 30) return 'Last month';
  return 'Older';
};

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
 * Extracts text content from a message, handling various content structures
 * @param msg The message to extract text from
 * @returns A string of text content from the message
 */
export const extractTextContent = (msg: ChatMessage): string => {
  if (typeof msg.content === 'string') {
    return msg.content;
  }

  if (Array.isArray(msg.content)) {
    return msg.content
      .filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join(' ');
  }

  return '';
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
 * Wraps matched text in a string with <strong> tags, preserving case
 * @param text - The full text to search within
 * @param searchTerm - The term to wrap in bold tags
 * @returns The text with matched terms wrapped in <strong> tags if searchTerm is at least 2 characters, otherwise returns original text
 */
export const highlightMatch = (
  text: string,
  searchTerm: string = '',
): string => {
  if (!searchTerm || searchTerm.length < 2) return text;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  //  '$1' let's us preserve the casing of the match
  return text.replace(regex, '<strong>$1</strong>');
};

/**
 * Removes the system prompt from the conversation array since we don't include that when searching
 */
const removeSystemMessages = (conversationHistory: ConversationHistory) => {
  return conversationHistory.conversation.filter(
    (msg) => msg.role !== 'system',
  );
};

/**
 *
 * Function to calculate context metrics based on messages and model's context length
 * @param chatMessages  Array of chat messages
 * @returns ContextMetrics object (promise)
 */
export async function calculateGptContextMetrics(
  chatMessages: ChatMessage[],
): Promise<ContextMetrics> {
  const messages = chatMessages as TextChatMessage[];
  const maxTokens = MODEL_REGISTRY['gpt-4o'].contextLength;
  const tokensUsed = encodeChat(messages, 'gpt-4o').length;
  const tokensRemaining = Math.max(0, maxTokens - tokensUsed);

  return {
    tokensRemaining,
  };
}
