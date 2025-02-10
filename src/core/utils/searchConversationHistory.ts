import { ConversationHistory } from '../context/types';

interface SearchResult {
  id: string;
  title: string;
}

/**
 * Searches through conversation history for matches in titles
 * @param searchTerm - The term to search for
 * @param conversations - The conversation store object
 * @returns Array of matching conversation IDs and titles
 */
export function searchConversationHistory(
  searchTerm: string,
  conversations: Record<string, ConversationHistory>,
): SearchResult[] {
  if (searchTerm.length === 0 || Object.keys(conversations).length === 0) {
    return [];
  }

  const term = searchTerm.toLowerCase().trim();

  return Object.entries(conversations)
    .filter(([_, data]) => {
      const title = data.title.toLowerCase();
      return title.includes(term);
    })
    .map(([id, data]) => ({
      id,
      title: data.title,
    }));
}
