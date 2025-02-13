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
 * @returns An object with time period keys and filtered, sorted conversations as values
 */
export const groupAndFilterConversations = (
  conversations: ConversationHistory[],
  searchTerm = '',
) => {
  if (!searchTerm) return {};

  return conversations
    .sort((a, b) => b.lastSaved - a.lastSaved)
    .map((conv) => {
      // If conversation is invalid (null/undefined), skip it
      if (!conv) return null;

      const lowerSearchTerm = searchTerm.toLowerCase();
      const messages =
        conv.conversation[0]?.role === 'system'
          ? conv.conversation.slice(1)
          : conv.conversation;

      for (const msg of messages) {
        if (msg.content && typeof msg.content === 'string') {
          const contentLower = msg.content.toLowerCase();
          if (contentLower.includes(lowerSearchTerm)) {
            const words = msg.content.split(' ');
            const start = words.findIndex((word) =>
              word.toLowerCase().includes(lowerSearchTerm),
            );
            const displayedPortion = words.slice(start, start + 6).join(' ');
            return { ...conv, displayedTitle: conv.title, displayedPortion };
          }
        }
      }
      if (conv.title.toLowerCase().includes(lowerSearchTerm)) {
        const snippet = conv.conversation
          .map((m) => m.content ?? '')
          .join(' ')
          .split(' ')
          .slice(0, 6)
          .join(' ');
        return {
          ...conv,
          displayedTitle: conv.title,
          displayedPortion: snippet,
        };
      }
      return null;
    })
    .filter(Boolean) // Removes any null or undefined values from the array
    .reduce((groups: GroupedConversations, conv) => {
      // Check if conv is null before accessing properties
      if (conv) {
        const timeGroup = getTimeGroup(conv.lastSaved);
        if (!groups[timeGroup]) groups[timeGroup] = [];
        groups[timeGroup].push(conv);
      }
      return groups;
    }, {} as GroupedConversations);
};
