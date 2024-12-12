import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { systemPrompt } from '../../config';

export type MsgStore = {
  history: ChatCompletionMessageParam[];
  streamingMessage: string;
};

export const msgStoreSlice = createSlice({
  name: 'msgStore',
  initialState: {
    history: [
      {
        role: 'system',
        content: systemPrompt,
      },
    ],
    streamingMessage: '',
  } as MsgStore,
  reducers: {
    streamingMessageConcat(state: MsgStore, action: PayloadAction<string>) {
      state.streamingMessage += action.payload;
    },

    streamingMessageClear(state: MsgStore, _: PayloadAction<void>) {
      state.streamingMessage = '';
    },

    messageHistoryAddMessage(
      state: MsgStore,
      action: PayloadAction<ChatCompletionMessageParam>,
    ) {
      if (action.payload.role === 'user') {
        const lastMsg = state.history[state.history.length - 1];
        // don't allow double user messages
        if (lastMsg.role !== 'user') {
          state.history = [...state.history, action.payload];
        }
      } else {
        state.history = [...state.history, action.payload];
      }
    },

    messageHistorySet(
      state: MsgStore,
      action: PayloadAction<ChatCompletionMessageParam[]>,
    ) {
      state.history = [...action.payload];
    },

    messageHistoryClear(state: MsgStore, _: PayloadAction<void>) {
      const systemMsg = { ...state.history[0] }; // keep system prompt
      state.history = [systemMsg];
    },

    messageHistoryDropLast(state: MsgStore, _: PayloadAction<void>) {
      let i = state.history.length - 1;

      while (i > 1) {
        if (state.history[i].role === 'user') {
          break;
        }
        i--;
      }

      if (i) state.history = state.history.slice(0, i);
    },
  },
});

export const {
  streamingMessageClear,
  streamingMessageConcat,
  messageHistoryAddMessage,
  messageHistoryClear,
  messageHistoryDropLast,
  messageHistorySet,
} = msgStoreSlice.actions;

export type MessageStoreSlice = { [msgStoreSlice.name]: MsgStore };

export const selectMessageStore = (state: MessageStoreSlice) =>
  state[msgStoreSlice.name];

export const selectStreamingMessage = createSelector(
  selectMessageStore,
  (state) => state.streamingMessage,
);

export const selectMessageHistory = createSelector(
  selectMessageStore,
  (state) => state.history,
);

export const selectHasToolCallInProgress = createSelector(
  selectMessageStore,
  (state) => {
    const lastMsg = state.history[state.history.length - 1];
    return (
      lastMsg.role === 'assistant' &&
      lastMsg.content === null &&
      Array.isArray(lastMsg.tool_calls)
    );
  },
);

export const selectHasImageGenerationInProgress = createSelector(
  selectMessageStore,
  (state) => {
    const lastMsg = state.history[state.history.length - 1];
    const isToolCall =
      lastMsg.role === 'assistant' &&
      lastMsg.content === null &&
      Array.isArray(lastMsg.tool_calls);

    if (isToolCall) {
      for (const tc of lastMsg.tool_calls!) {
        if (tc.function.name === 'generateImage') return true;
      }
    }

    return false;
  },
);

export const msgStoreReducer = msgStoreSlice.reducer;
