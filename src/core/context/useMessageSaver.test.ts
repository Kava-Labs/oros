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

  it('should create new chat with placeholder title for initial system message', async () => {
    const conversationId = 'test-id';
    mockMessageHistoryStore.getSnapshot.mockReturnValue([
      { role: 'system', content: 'System message' },
    ]);
    mockMessageHistoryStore.getConversationID.mockReturnValue(conversationId);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    const onChangeCb = mockMessageHistoryStore.subscribe.mock.calls[0][0];
    await onChangeCb();

    const savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );

    expect(savedConversations[conversationId]).toEqual({
      id: conversationId,
      model: 'test-model',
      title: 'New Chat',
      conversation: [{ role: 'system', content: 'System message' }],
      lastSaved: expect.any(Number),
    });
  });

  it('should clean up existing empty placeholder chats when creating new chat', async () => {
    const oldId = 'old-id';
    const newId = 'new-id';

    // Setup existing empty placeholder chat
    mockLocalStorage['conversations'] = JSON.stringify({
      [oldId]: {
        id: oldId,
        model: 'test-model',
        title: 'New Chat',
        conversation: [{ role: 'system', content: 'Old system message' }],
        lastSaved: Date.now(),
      },
    });

    mockMessageHistoryStore.getSnapshot.mockReturnValue([
      { role: 'system', content: 'New system message' },
    ]);
    mockMessageHistoryStore.getConversationID.mockReturnValue(newId);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    const onChangeCb = mockMessageHistoryStore.subscribe.mock.calls[0][0];
    await onChangeCb();

    const savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );

    expect(savedConversations[oldId]).toBeUndefined();
    expect(savedConversations[newId].title).toBe('New Chat');
  });

  it('should generate AI title when first user message is added to placeholder chat', async () => {
    const conversationId = 'test-id';
    const existingChat = {
      id: conversationId,
      model: 'test-model',
      title: 'New Chat',
      conversation: [{ role: 'system', content: 'System message' }],
      lastSaved: Date.now(),
    };

    mockLocalStorage['conversations'] = JSON.stringify({
      [conversationId]: existingChat,
    });

    const messages = [
      { role: 'system', content: 'System message' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ];

    mockMessageHistoryStore.getSnapshot.mockReturnValue(messages);
    mockMessageHistoryStore.getConversationID.mockReturnValue(conversationId);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    const onChangeCb = mockMessageHistoryStore.subscribe.mock.calls[0][0];
    await onChangeCb();

    const savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );

    expect(savedConversations[conversationId].title).toBe('Generated Title');
    expect(mockClient.chat.completions.create).toHaveBeenCalled();
  });

  it('should preserve existing non-placeholder title when messages are added', async () => {
    const conversationId = 'test-id';
    const existingTitle = 'Existing Chat Title';
    const existingChat = {
      id: conversationId,
      model: 'test-model',
      title: existingTitle,
      conversation: [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'Hello' },
      ],
      lastSaved: Date.now(),
    };

    mockLocalStorage['conversations'] = JSON.stringify({
      [conversationId]: existingChat,
    });

    const messages = [
      ...existingChat.conversation,
      { role: 'assistant', content: 'Hi' },
    ];

    mockMessageHistoryStore.getSnapshot.mockReturnValue(messages);
    mockMessageHistoryStore.getConversationID.mockReturnValue(conversationId);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    const onChangeCb = mockMessageHistoryStore.subscribe.mock.calls[0][0];
    await onChangeCb();

    const savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );

    expect(savedConversations[conversationId].title).toBe(existingTitle);
    expect(mockClient.chat.completions.create).not.toHaveBeenCalled();
  });

  it('should update lastSaved only when new messages are added', async () => {
    const originalTimestamp = 1234567890000;
    const newTimestamp = 1234567899999;
    const conversationId = 'test-id';
    const existingChat = {
      id: conversationId,
      model: 'test-model',
      title: 'Existing Title',
      conversation: [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ],
      lastSaved: originalTimestamp,
    };

    mockLocalStorage['conversations'] = JSON.stringify({
      [conversationId]: existingChat,
    });

    mockMessageHistoryStore.getSnapshot.mockReturnValue(
      existingChat.conversation,
    );
    mockMessageHistoryStore.getConversationID.mockReturnValue(conversationId);

    renderHook(() =>
      useMessageSaver(
        mockMessageHistoryStore as unknown as MessageHistoryStore,
        'test-model',
        mockClient,
      ),
    );

    const onChangeCb = mockMessageHistoryStore.subscribe.mock.calls[0][0];
    await onChangeCb();

    let savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );
    expect(savedConversations[conversationId].lastSaved).toBe(
      originalTimestamp,
    );

    // Add new message
    vi.setSystemTime(new Date(newTimestamp));
    const updatedMessages = [
      ...existingChat.conversation,
      { role: 'user', content: 'New message' },
    ];
    mockMessageHistoryStore.getSnapshot.mockReturnValue(updatedMessages);

    await onChangeCb();

    savedConversations = JSON.parse(
      localStorage.getItem('conversations') || '{}',
    );
    expect(savedConversations[conversationId].lastSaved).toBe(newTimestamp);
  });
});
