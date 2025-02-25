import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  estimateTokenUsage,
  updateConversationTokens,
  extractTokenUsageFromChunk,
  updateTokenUsage,
} from './helpers';
import {
  ChatMessage,
  MessageHistoryStore,
} from '../../core/stores/messageHistoryStore';
import { ChatCompletionChunk } from 'openai/resources/index';
import { ModelConfig } from '../../core/types/models';

describe('estimateTokenUsage', () => {
  it('should calculate tokens based on message length', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you for asking!' },
    ];

    const result = estimateTokenUsage(messages);

    // "Hello, how are you?" is 19 chars, so ~5 tokens
    // "I am doing well, thank you for asking!" is 42 chars, so ~10 tokens
    expect(result.prompt_tokens).toBe(5);
    expect(result.completion_tokens).toBe(10);
    expect(result.total_tokens).toBe(15);
  });

  it('should handle empty messages', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '' },
      { role: 'assistant', content: '' },
    ];

    const result = estimateTokenUsage(messages);

    expect(result.prompt_tokens).toBe(0);
    expect(result.completion_tokens).toBe(0);
    expect(result.total_tokens).toBe(0);
  });

  it('should correctly categorize tokens by role', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'User message 1' },
      { role: 'system', content: 'System message' },
      { role: 'assistant', content: 'Assistant response 1' },
      { role: 'user', content: 'User message 2' },
      { role: 'assistant', content: 'Assistant response 2' },
    ];

    const result = estimateTokenUsage(messages);

    //  User messages + system = (14 + 14 + 14)/4 ≈ 11 tokens
    //  Assistant messages = (20 + 20)/4 ≈ 10 tokens
    expect(result.prompt_tokens).toBe(12);
    expect(result.completion_tokens).toBe(10);
    expect(result.total_tokens).toBe(22);
  });
});

describe('updateConversationTokens', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key) => localStorageMock[key] ?? '',
    );

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      localStorageMock[key] = value.toString();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update tokens remaining for an existing conversation', () => {
    const conversationID = 'test-conversation-id';
    const modelConfig = { contextLength: 4000 };
    const usageInfo = { total_tokens: 1000 };

    localStorageMock['conversations'] = JSON.stringify({
      [conversationID]: {
        tokensRemaining: 4000,
      },
    });

    updateConversationTokens(conversationID, modelConfig, usageInfo);

    const savedConversations = JSON.parse(localStorageMock['conversations']);
    expect(savedConversations[conversationID].tokensRemaining).toBe(3000);
  });

  it('should return context length when conversation does not exist', () => {
    const conversationID = 'non-existent-conversation';
    const modelConfig = { contextLength: 4000 };
    const usageInfo = { total_tokens: 1000 };

    localStorageMock['conversations'] = JSON.stringify({});

    const result = updateConversationTokens(
      conversationID,
      modelConfig,
      usageInfo,
    );

    expect(result).toBe(4000);
    const savedConversations = JSON.parse(localStorageMock['conversations']);
    expect(savedConversations[conversationID]).toBeUndefined();
  });

  it('should cap tokens remaining at zero when usage exceeds context length', () => {
    const conversationID = 'test-conversation-id';
    const modelConfig = { contextLength: 1000 };
    const usageInfo = { total_tokens: 1500 };

    localStorageMock['conversations'] = JSON.stringify({
      [conversationID]: {
        tokensRemaining: 500,
      },
    });

    updateConversationTokens(conversationID, modelConfig, usageInfo);

    const savedConversations = JSON.parse(localStorageMock['conversations']);
    expect(savedConversations[conversationID].tokensRemaining).toBe(0);
  });
});

describe('extractTokenUsageFromChunk', () => {
  it('should extract token usage from a valid chunk', () => {
    const chunk = {
      usage: {
        total_tokens: 100,
        prompt_tokens: 60,
        completion_tokens: 40,
      },
    } as ChatCompletionChunk;

    const result = extractTokenUsageFromChunk(chunk);

    expect(result).toEqual({
      total_tokens: 100,
      prompt_tokens: 60,
      completion_tokens: 40,
    });
  });

  it('should return null for chunks without usage information', () => {
    const chunk = {} as ChatCompletionChunk;
    const result = extractTokenUsageFromChunk(chunk);
    expect(result).toBeNull();
  });

  it('should return null for null or undefined chunks', () => {
    const nullChunk = null as unknown as ChatCompletionChunk;
    const undefinedChunk = undefined as unknown as ChatCompletionChunk;
    expect(extractTokenUsageFromChunk(nullChunk)).toBeNull();
    expect(extractTokenUsageFromChunk(undefinedChunk)).toBeNull();
  });
});

describe('updateTokenUsage', () => {
  let localStorageMock: Record<string, string>;
  let messageHistoryStoreMock: MessageHistoryStore;

  beforeEach(() => {
    localStorageMock = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key) => localStorageMock[key] ?? null,
    );

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      localStorageMock[key] = value.toString();
    });

    messageHistoryStoreMock = {
      getSnapshot: vi.fn().mockReturnValue([
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Test response' },
      ]),
    } as unknown as MessageHistoryStore;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use API token counts when available for deepseek', () => {
    const conversationID = 'test-conversation-id';
    const modelConfig = {
      contextLength: 4000,
      id: 'deepseek-r1',
    } as ModelConfig;

    localStorageMock['conversations'] = JSON.stringify({
      [conversationID]: {
        tokensRemaining: 4000,
      },
    });
    const apiResponse = {
      usage: {
        total_tokens: 150,
        prompt_tokens: 50,
        completion_tokens: 100,
      },
    } as ChatCompletionChunk;

    updateTokenUsage(
      conversationID,
      modelConfig,
      apiResponse,
      messageHistoryStoreMock,
    );

    expect(messageHistoryStoreMock.getSnapshot).not.toHaveBeenCalled(); // Should not need to estimate
    const savedConversations = JSON.parse(localStorageMock['conversations']);
    expect(savedConversations[conversationID].tokensRemaining).toBe(3850); // 4000 - 150
  });

  it('should fall back to token estimation when API data is not available', () => {
    const conversationID = 'test-conversation-id';
    const modelConfig = { contextLength: 4000 } as ModelConfig;
    const apiResponse = {} as ChatCompletionChunk; // No usage data

    localStorageMock['conversations'] = JSON.stringify({
      [conversationID]: {
        tokensRemaining: 4000,
      },
    });

    updateTokenUsage(
      conversationID,
      modelConfig,
      apiResponse,
      messageHistoryStoreMock,
    );

    expect(messageHistoryStoreMock.getSnapshot).toHaveBeenCalled(); // Should need to estimate
    const savedConversations = JSON.parse(localStorageMock['conversations']);

    // "Test message" + "Test response" = 25 chars total, which is around 7 tokens
    expect(savedConversations[conversationID].tokensRemaining).toBe(3993); // 4000 - 7
  });
});
