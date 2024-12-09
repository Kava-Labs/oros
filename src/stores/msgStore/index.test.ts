import {
  msgStoreReducer,
  streamingMessageConcat,
  streamingMessageClear,
  messageHistoryAddMessage,
  messageHistoryClear,
  messageHistoryDropLast,
  selectMessageStore,
  selectStreamingMessage,
  selectMessageHistory,
  MsgStore,
  selectHasToolCallInProgress,
} from './index';
import type { ChatCompletionMessageParam } from 'openai/resources/index';

const initialState: MsgStore = {
  history: [
    {
      role: 'system',
      content: 'This is the system prompt.',
    },
  ],
  streamingMessage: '',
};

describe('reducers', () => {
  describe('streamingMessageConcat', () => {
    it('should append payload to streamingMessage', () => {
      const action = streamingMessageConcat('Hello, ');
      const state = msgStoreReducer(initialState, action);
      expect(state.streamingMessage).toBe('Hello, ');

      const nextState = msgStoreReducer(
        state,
        streamingMessageConcat('World!'),
      );
      expect(nextState.streamingMessage).toBe('Hello, World!');
    });
  });

  describe('streamingMessageClear', () => {
    it('should clear streamingMessage', () => {
      const stateWithMessage: MsgStore = {
        ...initialState,
        streamingMessage: 'Existing message',
      };
      const action = streamingMessageClear();
      const newState = msgStoreReducer(stateWithMessage, action);
      expect(newState.streamingMessage).toBe('');
    });
  });

  describe('messageHistoryAddMessage', () => {
    it('should add a message to history', () => {
      const newMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: 'Hello there!',
      };
      const action = messageHistoryAddMessage(newMessage);
      const newState = msgStoreReducer(initialState, action);
      expect(newState.history).toHaveLength(2);
      expect(newState.history[1]).toEqual(newMessage);
    });

    it('should not add a user message to history if last message is already a user message', () => {
      const newMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: 'Hello there!',
      };
      const action = messageHistoryAddMessage(newMessage);
      const newState = msgStoreReducer(
        {
          history: [
            {
              role: 'system',
              content: 'This is the system prompt.',
            },
            { role: 'user', content: 'hello from the user' },
          ],
          streamingMessage: '',
        },
        action,
      );

      expect(newState.history).toHaveLength(2);
      // should not have added newMessage
      expect(newState.history[1]).toEqual({
        role: 'user',
        content: 'hello from the user',
      });
    });
  });

  describe('messageHistoryClear', () => {
    it('should reset history to only include the system prompt', () => {
      const stateWithHistory: MsgStore = {
        ...initialState,
        history: [
          ...initialState.history,
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      };
      const action = messageHistoryClear();
      const newState = msgStoreReducer(stateWithHistory, action);
      expect(newState.history).toHaveLength(1);
      expect(newState.history[0]).toEqual(initialState.history[0]);
    });
  });

  describe('messageHistoryDropLast', () => {
    it('should drop the last message if it is from the user', () => {
      const stateWithHistory: MsgStore = {
        ...initialState,
        history: [
          ...initialState.history,
          { role: 'user', content: 'Question?' },
          { role: 'assistant', content: 'Answer.' },
          { role: 'user', content: 'Another question?' },
        ],
      };
      const action = messageHistoryDropLast();
      const newState = msgStoreReducer(stateWithHistory, action);
      expect(newState.history).toHaveLength(3);
      expect(newState.history[2]).toEqual({
        role: 'assistant',
        content: 'Answer.',
      });
    });

    it('should drop the last message and the user question', () => {
      const stateWithHistory: MsgStore = {
        ...initialState,
        history: [
          ...initialState.history,
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      };
      const action = messageHistoryDropLast();
      const newState = msgStoreReducer(stateWithHistory, action);
      expect(newState.history).toHaveLength(1);
      expect(newState.history[0]).toEqual(initialState.history[0]);
    });

    it('should handle history with only the system prompt', () => {
      const action = messageHistoryDropLast();
      const newState = msgStoreReducer(initialState, action);
      expect(newState.history).toHaveLength(1);
      expect(newState.history[0]).toEqual(initialState.history[0]);
    });

    it('should handle removal of tool call messages and the triggering question', () => {
      const stateWithHistory: MsgStore = {
        ...initialState,
        history: [
          ...initialState.history,
          { role: 'user', content: 'hi' },
          { role: 'assistant', content: 'how can i help you?' },
          { role: 'user', content: 'get my balances' },
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                type: 'function',
                function: { name: 'getBalances', arguments: '' },
                id: '1',
              },
            ],
          },
          {
            role: 'tool',
            content: 'System message after assistant response.',
            tool_call_id: '1',
          },
        ],
      };
      const action = messageHistoryDropLast();
      const newState = msgStoreReducer(stateWithHistory, action);
      expect(newState.history).toHaveLength(3);
      expect(newState.history[2]).toEqual({
        role: 'assistant',
        content: 'how can i help you?',
      });
    });
  });
});

describe('selectors', () => {
  const mockState = {
    msgStore: {
      history: [...initialState.history, { role: 'user', content: 'Hello' }],
      streamingMessage: 'Typing...',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it('selectMessageStore should return the msgStore slice', () => {
    const selected = selectMessageStore(mockState);
    expect(selected).toEqual(mockState.msgStore);
  });

  it('selectStreamingMessage should return streamingMessage', () => {
    const selected = selectStreamingMessage(mockState);
    expect(selected).toBe('Typing...');
  });

  it('selectMessageHistory should return history', () => {
    const selected = selectMessageHistory(mockState);
    expect(selected).toEqual(mockState.msgStore.history);
  });

  it('selectHasToolCallInProgress should return false when there is no tool call in progress', () => {
    const selected = selectHasToolCallInProgress(mockState);
    expect(selected).toBe(false);
  });

  it('selectHasToolCallInProgress should return true when there is a tool call in progress', () => {
    const selected = selectHasToolCallInProgress({
      msgStore: {
        history: [
          ...initialState.history,
          { role: 'user', content: 'Hello' },
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: '',
                type: 'function',
                function: { name: '', arguments: '' },
              },
            ],
          },
        ],
        streamingMessage: '',
      },
    });

    expect(selected).toBe(true);
  });

  it('selectHasToolCallInProgress should return false when there is a tool call is finished', () => {
    const selected = selectHasToolCallInProgress({
      msgStore: {
        history: [
          ...initialState.history,
          { role: 'user', content: 'Hello' },
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: '',
                type: 'function',
                function: { name: '', arguments: '' },
              },
            ],
          },
          { role: 'tool', content: '', tool_call_id: '' },
        ],
        streamingMessage: '',
      },
    });

    expect(selected).toBe(false);
  });
});
