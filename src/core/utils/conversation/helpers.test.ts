import {
  formatContentSnippet,
  groupAndFilterConversations,
  groupConversationsByTime,
} from './helpers';
import { ConversationHistory } from '../../context/types';
import { ChatCompletionMessageParam } from 'openai/resources/index';

describe('groupConversationsByTime', () => {
  let mockConversations: ConversationHistory[];
  const now = new Date('2024-02-13T12:00:00Z').getTime();

  beforeEach(() => {
    vi.spyOn(Date.prototype, 'getTime').mockImplementation(() => now);

    mockConversations = [
      {
        id: '1',
        title: 'Today Chat',
        lastSaved: now - 1000 * 60 * 60 * 2, // 2 hours ago
        conversation: [],
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
      {
        id: '2',
        title: 'Yesterday Chat',
        lastSaved: now - 1000 * 60 * 60 * 25, // 25 hours ago
        conversation: [],
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
      {
        id: '3',
        title: 'Last Week Chat',
        lastSaved: now - 1000 * 60 * 60 * 24 * 5, // 5 days ago
        conversation: [],
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should group conversations by time period', () => {
    const grouped = groupConversationsByTime(mockConversations);

    expect(Object.keys(grouped)).toEqual(['Today', 'Yesterday', 'Last week']);
    expect(grouped['Today'][0].title).toBe('Today Chat');
    expect(grouped['Yesterday'][0].title).toBe('Yesterday Chat');
    expect(grouped['Last week'][0].title).toBe('Last Week Chat');
  });

  it('should sort conversations by timestamp within groups', () => {
    const anotherTodayChat = {
      id: '4',
      title: 'Another Today Chat',
      lastSaved: now - 1000 * 60 * 60, // 1 hour ago
      conversation: [],
      model: 'gpt-4o-mini',
      tokensRemaining: 128000,
    };
    mockConversations.push(anotherTodayChat);

    const grouped = groupConversationsByTime(mockConversations);
    expect(grouped['Today'][0].title).toBe('Another Today Chat');
    expect(grouped['Today'][1].title).toBe('Today Chat');
  });

  it('should handle empty conversations array', () => {
    const grouped = groupConversationsByTime([]);
    expect(grouped).toEqual({});
  });
});

describe('groupAndFilterConversations', () => {
  let mockConversationHistories: ConversationHistory[];
  const now = new Date('2024-02-13T12:00:00Z').getTime();

  beforeEach(() => {
    vi.spyOn(Date.prototype, 'getTime').mockImplementation(() => now);

    const mockConversation: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'System prompt that should be ignored',
      },
      {
        role: 'user',
        content: 'First user message',
      },
      {
        role: 'assistant',
        content: 'First assistant response with searchable content',
      },
      {
        role: 'user',
        content: 'Second user message with different content',
      },
    ];

    mockConversationHistories = [
      {
        id: '1',
        title: 'Bitcoin Discussion',
        lastSaved: now - 1000 * 60 * 60 * 2,
        conversation: mockConversation,
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
      {
        id: '2',
        title: 'Ethereum Chat',
        lastSaved: now - 1000 * 60 * 60 * 25,
        conversation: [],
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
      {
        id: '3',
        title: 'Blockchain Overview',
        lastSaved: now - 1000 * 60 * 60 * 24 * 5,
        conversation: [],
        model: 'gpt-4o-mini',
        tokensRemaining: 128000,
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should filter conversations based on search term', () => {
    const filtered = groupAndFilterConversations(
      mockConversationHistories,
      'bitcoin',
    );
    expect(Object.keys(filtered)).toEqual(['Today']);
    expect(filtered['Today'][0].title).toBe('Bitcoin Discussion');
  });

  it('should be case insensitive when filtering', () => {
    const filtered = groupAndFilterConversations(
      mockConversationHistories,
      'BITCOIN',
    );
    expect(filtered['Today'][0].title).toBe('Bitcoin Discussion');
  });

  it('should handle partial matches', () => {
    const filtered = groupAndFilterConversations(
      mockConversationHistories,
      'block',
    );
    expect(filtered['Last week'][0].title).toBe('Blockchain Overview');
  });

  it('should return all conversations when search term is empty', () => {
    const filtered = groupAndFilterConversations(mockConversationHistories, '');
    expect(Object.keys(filtered)).toEqual(['Today', 'Yesterday', 'Last week']);
  });
});

describe('formatContentSnippet', () => {
  const mockConversation: ConversationHistory = {
    id: 'test-id',
    title: 'Test Conversation',
    model: 'test-model',
    lastSaved: Date.now(),
    tokensRemaining: 128000,
    conversation: [
      {
        role: 'system',
        content: 'System prompt that should be ignored',
      },
      {
        role: 'user',
        content: 'First user message',
      },
      {
        role: 'assistant',
        content: 'First assistant response with searchable content',
      },
      {
        role: 'user',
        content: 'Second user message with different content',
      },
    ],
  };

  it('returns snippet starting with search term when found at start of message', () => {
    const result = formatContentSnippet(mockConversation, 'First');
    expect(result).toBe('First user message');
  });

  it('includes up to 3 words before search term when found mid-message', () => {
    const conversationWithMidMatch: ConversationHistory = {
      ...mockConversation,
      conversation: [
        {
          role: 'assistant',
          content: 'The quick brown fox jumps over the lazy dog',
        },
      ],
    };
    const result = formatContentSnippet(conversationWithMidMatch, 'jumps');
    expect(result).toBe('quick brown fox jumps over the lazy dog');
  });

  it('includes fewer preceding words if not enough before match', () => {
    const conversationWithShortPrefix: ConversationHistory = {
      ...mockConversation,
      conversation: [
        {
          role: 'assistant',
          content: 'quick brown jumps over',
        },
      ],
    };
    const result = formatContentSnippet(conversationWithShortPrefix, 'jumps');
    expect(result).toBe('quick brown jumps over');
  });

  it('returns first user message when no search term is provided (initial state before user types and all histories are shown)', () => {
    const result = formatContentSnippet(mockConversation);
    expect(result).toBe('First user message');
  });

  it('returns first user message when matching by title only', () => {
    const result = formatContentSnippet(mockConversation, 'Test');
    expect(result).toBe('First user message');
  });

  it('is case insensitive for search matches', () => {
    let result = formatContentSnippet(mockConversation, 'JUMPS');
    const conversationWithMidMatch: ConversationHistory = {
      ...mockConversation,
      conversation: [
        {
          role: 'assistant',
          content: 'The quick brown fox jumps over the lazy dog',
        },
      ],
    };
    result = formatContentSnippet(conversationWithMidMatch, 'JUMPS');
    expect(result).toBe('quick brown fox jumps over the lazy dog');
  });

  it('truncates long matches to 100 characters', () => {
    const longConversation: ConversationHistory = {
      ...mockConversation,
      conversation: [
        {
          role: 'assistant',
          content: 'preceding words match ' + 'a'.repeat(200),
        },
      ],
    };
    const result = formatContentSnippet(longConversation, 'match');
    expect(result.length).toBe(100);
    expect(result).toContain('preceding words match');
  });
});
