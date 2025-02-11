import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMessageSaver } from './useMessageSaver';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import OpenAI from 'openai';
import type { Mock } from 'vitest';

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Generated Title' } }],
          }),
        },
      },
    })),
  };
});

describe('useMessageSaver', () => {
  let mockMessageHistoryStore: {
    getSnapshot: Mock;
    getConversationID: Mock;
    subscribe: Mock;
  };
  let mockClient: OpenAI;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Setup mock localStorage
    mockLocalStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key) => mockLocalStorage[key] || null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key, value) => (mockLocalStorage[key] = value),
    );

    mockMessageHistoryStore = {
      getSnapshot: vi.fn(),
      getConversationID: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };

    // Setup mock OpenAI client
    mockClient = new OpenAI();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not save conversation with less than 3 messages', () => {
    mockMessageHistoryStore.getSnapshot.mockReturnValue([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ]);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    expect(localStorage.getItem('conversations')).toBeNull();
  });

  it('should create new conversation with initial lastSaved timestamp', async () => {
    const mockTime = 1234567890000;
    vi.setSystemTime(new Date(mockTime));

    const messages = [
      { role: 'system', content: 'System message' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ];
    const conversationId = 'test-id';

    mockMessageHistoryStore.getSnapshot.mockReturnValue(messages);
    mockMessageHistoryStore.getConversationID.mockReturnValue(conversationId);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    // Trigger the onChange callback
    const onChangeCb = mockMessageHistoryStore.subscribe.mock.calls[0][0];
    await onChangeCb();

    const savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );

    expect(savedConversations[conversationId]).toBeDefined();
    expect(savedConversations[conversationId].lastSaved).toBe(mockTime);
    expect(savedConversations[conversationId].model).toBe('test-model');
  });

  it('should preserve lastSaved when loading existing conversation', async () => {
    const originalTimestamp = 1234567890000;
    const conversationId = 'test-id';
    const existingConversation = {
      id: conversationId,
      model: 'test-model',
      modelName: 'test-model',
      title: 'Existing Title',
      conversation: [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ],
      lastSaved: originalTimestamp,
    };

    mockLocalStorage['conversations'] = JSON.stringify({
      [conversationId]: existingConversation,
    });

    mockMessageHistoryStore.getSnapshot.mockReturnValue(
      existingConversation.conversation,
    );
    mockMessageHistoryStore.getConversationID.mockReturnValue(conversationId);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    // Trigger the onChange callback
    const onChangeCb = mockMessageHistoryStore.subscribe.mock.calls[0][0];
    await onChangeCb();

    const savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );

    expect(savedConversations[conversationId].lastSaved).toBe(
      originalTimestamp,
    );
  });

  it('should update lastSaved only when new messages are added to existing conversation', async () => {
    const originalTimestamp = 1234567890000;
    const newTimestamp = 1234567899999;
    const conversationId = 'test-id';

    // Set up initial conversation
    const existingConversation = {
      id: conversationId,
      model: 'test-model',
      modelName: 'test-model',
      title: 'Existing Title',
      conversation: [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ],
      lastSaved: originalTimestamp,
    };

    mockLocalStorage['conversations'] = JSON.stringify({
      [conversationId]: existingConversation,
    });

    // Mock initial load
    mockMessageHistoryStore.getSnapshot.mockReturnValue(
      existingConversation.conversation,
    );
    mockMessageHistoryStore.getConversationID.mockReturnValue(conversationId);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    // Trigger initial onChange
    const onChangeCb = mockMessageHistoryStore.subscribe.mock.calls[0][0];
    await onChangeCb();

    // Verify timestamp hasn't changed after load
    let savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );
    expect(savedConversations[conversationId].lastSaved).toBe(
      originalTimestamp,
    );

    // Simulate adding a new message
    vi.setSystemTime(new Date(newTimestamp));
    const updatedConversation = [
      ...existingConversation.conversation,
      { role: 'user', content: 'New message' },
    ];
    mockMessageHistoryStore.getSnapshot.mockReturnValue(updatedConversation);

    // Trigger onChange again
    await onChangeCb();

    // Verify timestamp has updated
    savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );
    expect(savedConversations[conversationId].lastSaved).toBe(newTimestamp);
  });
});
