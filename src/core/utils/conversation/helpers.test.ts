import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateContextMetrics,
  formatContentSnippet,
  formatConversationTitle,
  getTimeGroup,
  groupAndFilterConversations,
  groupConversationsByTime,
  MAX_TOKENS,
} from './helpers';
import { ConversationHistory } from '../../context/types';
import { ChatCompletionMessageParam } from 'openai/resources/index';
import { ChatMessage } from '../../stores/messageHistoryStore';

describe('formatConversationTitle', () => {
  it('should remove double quotes from beginning and end', () => {
    expect(formatConversationTitle('"Hello World"', 20)).toBe('Hello World');
  });

  it('should remove single quotes from beginning and end', () => {
    expect(formatConversationTitle("'Hello World'", 20)).toBe('Hello World');
  });

  it('should handle mixed quotes', () => {
    expect(formatConversationTitle('"Hello World\'', 20)).toBe('Hello World');
    expect(formatConversationTitle('\'Hello World"', 20)).toBe('Hello World');
  });

  it('should not remove quotes from middle of string', () => {
    expect(formatConversationTitle('Hello "World" Test', 20)).toBe(
      'Hello "World" Test',
    );
  });

  it('should truncate strings longer than maxLength', () => {
    expect(formatConversationTitle('This is a very long title', 10)).toBe(
      'This is a ....',
    );
  });

  it('should not modify strings shorter than maxLength', () => {
    expect(formatConversationTitle('Short', 10)).toBe('Short');
  });

  it('should handle strings with exactly maxLength', () => {
    expect(formatConversationTitle('1234567890', 10)).toBe('1234567890');
  });

  it('should handle strings with quotes and requiring truncation', () => {
    expect(
      formatConversationTitle('"This is a very long quoted title"', 10),
    ).toBe('This is a ....');
  });
});

describe('getTimeGroup', () => {
  beforeEach(() => {
    // establish a fixed date for testing
    const now = new Date('2024-02-13T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Today" for same day timestamps', () => {
    const today = new Date('2024-02-13T10:00:00Z').getTime();
    expect(getTimeGroup(today)).toBe('Today');
  });

  it('should return "Yesterday" for previous day timestamps', () => {
    const yesterday = new Date('2024-02-12T10:00:00Z').getTime();
    expect(getTimeGroup(yesterday)).toBe('Yesterday');
  });

  it('should return "Last week" for timestamps within 7 days', () => {
    const sixDaysAgo = new Date('2024-02-07T10:00:00Z').getTime();
    expect(getTimeGroup(sixDaysAgo)).toBe('Last week');
  });

  it('should return "2 weeks ago" for timestamps within 14 days', () => {
    const twelveDaysAgo = new Date('2024-02-01T10:00:00Z').getTime();
    expect(getTimeGroup(twelveDaysAgo)).toBe('2 weeks ago');
  });

  it('should return "Last month" for timestamps within 30 days', () => {
    const twentyFiveDaysAgo = new Date('2024-01-19T10:00:00Z').getTime();
    expect(getTimeGroup(twentyFiveDaysAgo)).toBe('Last month');
  });

  it('should return "Older" for timestamps older than 30 days', () => {
    const longLongAgo = new Date('2023-01-04T10:00:00Z').getTime();
    expect(getTimeGroup(longLongAgo)).toBe('Older');
  });
});

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
      },
      {
        id: '2',
        title: 'Yesterday Chat',
        lastSaved: now - 1000 * 60 * 60 * 25, // 25 hours ago
        conversation: [],
        model: 'gpt-4o-mini',
      },
      {
        id: '3',
        title: 'Last Week Chat',
        lastSaved: now - 1000 * 60 * 60 * 24 * 5, // 5 days ago
        conversation: [],
        model: 'gpt-4o-mini',
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
      },
      {
        id: '2',
        title: 'Ethereum Chat',
        lastSaved: now - 1000 * 60 * 60 * 25,
        conversation: [],
        model: 'gpt-4o-mini',
      },
      {
        id: '3',
        title: 'Blockchain Overview',
        lastSaved: now - 1000 * 60 * 60 * 24 * 5,
        conversation: [],
        model: 'gpt-4o-mini',
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

describe('calculateContextMetrics', () => {
  it('initializing with system prompt', async () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'I am helpful' },
    ];
    const result = await calculateContextMetrics(mockMessages);

    expect(result).toEqual({
      tokensUsed: 10, //  amount from the system prompt
      tokensRemaining: MAX_TOKENS - 10,
      percentageRemaining: 99.9,
    });
  });

  it('calculates tokens as conversation proceeds', async () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'I am helpful' },
      {
        role: 'user',
        content: 'Lorem ipsum odor amet, consectetuer adipiscing elit.',
      },
    ];
    const result = await calculateContextMetrics(mockMessages);

    expect(result).toEqual({
      tokensUsed: 25, //  additional tokens used
      tokensRemaining: MAX_TOKENS - 25,
      percentageRemaining: 99.9,
    });

    const updatedMessages: ChatMessage[] = [
      ...mockMessages,
      { role: 'assistant', content: 'Do you speak Latin?' },
    ];

    const updatedResult = await calculateContextMetrics(updatedMessages);

    expect(updatedResult).toEqual({
      tokensUsed: 34, //  more tokens used
      tokensRemaining: MAX_TOKENS - 34,
      percentageRemaining: 99.9,
    });
  });

  it('handles large input', async () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'Make a giant string'.repeat(30000) },
    ];
    const result = await calculateContextMetrics(mockMessages);

    expect(result).toEqual({
      tokensUsed: 120007,
      tokensRemaining: MAX_TOKENS - 120007,
      percentageRemaining: 6.2,
    });
  });
});
