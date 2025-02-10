import { searchConversationHistory } from './searchConversationHistory';
import { ConversationHistory } from '../context/types';

describe('searchConversationHistory', () => {
  const mockConversations: Record<string, ConversationHistory> = {
    '1': {
      id: '1',
      model: 'test-model',
      title: '"Greeting discussion"', //  extra quotations added by model
      conversation: [],
      lastSaved: 123456789,
    },
    '2': {
      id: '2',
      model: 'test-model',
      title: 'Project Planning',
      conversation: [],
      lastSaved: 123456789,
    },
    '3': {
      id: '3',
      model: 'test-model',
      title: 'Great Ideas',
      conversation: [],
      lastSaved: 123456789,
    },
  };

  it('should return empty array for empty search term', () => {
    const result = searchConversationHistory('', mockConversations);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty conversations', () => {
    const result = searchConversationHistory('test', {});
    expect(result).toEqual([]);
  });

  it('should find matches (case-insensitive)', () => {
    const result = searchConversationHistory('gre', mockConversations);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ id: '1', title: '"Greeting discussion"' });
    expect(result).toContainEqual({ id: '3', title: 'Great Ideas' });
  });

  it('should return empty array for non-matching search', () => {
    const result = searchConversationHistory('xyz', mockConversations);
    expect(result).toEqual([]);
  });

  it('should match partial words', () => {
    const result = searchConversationHistory('planning ', mockConversations);
    expect(result).toHaveLength(1);
    expect(result).toContainEqual({ id: '2', title: 'Project Planning' });
  });
});
