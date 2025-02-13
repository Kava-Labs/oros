import { ConversationHistory } from '../../context/types';

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
 * Groups and filters conversations based on a search term
 * @param conversations - Array of conversation histories
 * @param searchTerm - Optional search term to filter conversations
 * @param snippetLength - Optional number of words to include in the snippet (default: 6)
 * @returns An object with time period keys and filtered, sorted conversations as values
 */
export const groupAndFilterConversations = (
  conversations: ConversationHistory[],
  searchTerm = '',
  snippetLength = 6,
): Record<string, ConversationHistory[]> => {
  if (!searchTerm) {
    return conversations.reduce(
      (groups, conv) => {
        const timeGroup = getTimeGroup(conv.lastSaved);
        if (!groups[timeGroup]) groups[timeGroup] = [];
        groups[timeGroup].push(conv);
        return groups;
      },
      {} as Record<string, ConversationHistory[]>,
    );
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  const filteredConversations = conversations
    .map((conv) => {
      // Skip the system message (the first element) when checking the conversation content
      const messages =
        conv.conversation[0]?.role === 'system'
          ? conv.conversation.slice(1)
          : conv.conversation;

      // Check for title match
      const titleMatch = conv.title.toLowerCase().includes(lowerSearchTerm);

      // Check for content match
      const contentMatch = messages.some(
        (msg) =>
          msg.role !== 'system' &&
          typeof msg.content === 'string' &&
          msg.content.toLowerCase().includes(lowerSearchTerm),
      );

      if (!titleMatch && !contentMatch) return null;

      let displayedPortion = '';
      // Prioritize content match if exists
      if (contentMatch) {
        // Find the first message with a match and ensure the snippet starts with the matched term
        for (const msg of messages) {
          if (
            typeof msg.content === 'string' &&
            msg.content.toLowerCase().includes(lowerSearchTerm)
          ) {
            const words = msg.content.split(' ');
            const matchIndex = words.findIndex((word) =>
              word.toLowerCase().includes(lowerSearchTerm),
            );

            // Calculate snippet start to ensure matched term is at the beginning
            const snippetStart = Math.max(0, matchIndex);
            displayedPortion = words
              .slice(snippetStart, snippetStart + snippetLength)
              .join(' ');
            break;
          }
        }
      }

      // If no content match or displayedPortion is empty, use first user message
      if (!displayedPortion) {
        const firstUserMessage = messages.find((msg) => msg.role === 'user');
        if (firstUserMessage && typeof firstUserMessage.content === 'string') {
          displayedPortion = firstUserMessage.content
            .split(' ')
            .slice(0, snippetLength)
            .join(' ');
        }
      }

      return {
        ...conv,
        displayedTitle: formatConversationTitle(conv.title, 30),
        displayedPortion: displayedPortion || '',
      };
    })
    .filter(Boolean) as ConversationHistory[];

  // Group filtered conversations
  return filteredConversations.reduce(
    (groups, conv) => {
      const timeGroup = getTimeGroup(conv.lastSaved);
      if (!groups[timeGroup]) groups[timeGroup] = [];
      groups[timeGroup].push(conv);
      return groups;
    },
    {} as Record<string, ConversationHistory[]>,
  );
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
) => {
  const messages =
    conversation.conversation[0]?.role === 'system'
      ? conversation.conversation.slice(1)
      : conversation.conversation;

  if (searchTerm) {
    const matchingMessage = messages.find(
      (msg) =>
        typeof msg.content === 'string' &&
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (matchingMessage && matchingMessage.content) {
      const content = Array.isArray(matchingMessage.content)
        ? matchingMessage.content.map((part) => part).join('')
        : matchingMessage.content;

      const searchIndex = content
        .toLowerCase()
        .indexOf(searchTerm.toLowerCase());

      // Find start of snippet considering up to 3 words before match
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
  if (firstUserMessage && firstUserMessage.content) {
    const content = Array.isArray(firstUserMessage.content)
      ? firstUserMessage.content.map((part) => part).join('')
      : firstUserMessage.content;
    return content.slice(0, 100);
  }

  return '';
};
