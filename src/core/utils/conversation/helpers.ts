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
      if (contentMatch) {
        // Find the first message with a match and extract surrounding context
        for (const msg of messages) {
          if (
            typeof msg.content === 'string' &&
            msg.content.toLowerCase().includes(lowerSearchTerm)
          ) {
            const words = msg.content.split(' ');
            const matchIndex = words.findIndex((word) =>
              word.toLowerCase().includes(lowerSearchTerm),
            );

            // Get a snippet around the matched word
            const snippetStart = Math.max(0, matchIndex - 2);
            displayedPortion = words
              .slice(snippetStart, snippetStart + snippetLength)
              .join(' ');
            break;
          }
        }
      } else if (titleMatch) {
        // If only title matches, set the first user message as the snippet
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
