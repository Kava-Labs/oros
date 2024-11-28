import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { systemPrompt } from '../../config';


export type MsgStore = {
    history: ChatCompletionMessageParam[];
    streamingMessage: string,
}

export const msgStoreSlice = createSlice({
    name: 'msgStore',
    initialState: {
        history: [{
            role: 'system',
            content: systemPrompt,
        }],
        streamingMessage: '',
    } as MsgStore,
    reducers: {
        streamingMessageConcat(state: MsgStore, action: PayloadAction<string>) {
            state.streamingMessage += action.payload;
        },

        streamingMessageClear(state: MsgStore, _: PayloadAction<void>) {
            state.streamingMessage = '';
        },

        messageHistoryAddMessage(state: MsgStore, action: PayloadAction<ChatCompletionMessageParam>) {
            state.history = [...state.history, action.payload]
        },

        messageHistoryClear(state: MsgStore, _: PayloadAction<void>) {
            const systemMsg = { ...state.history[0] }; // keep system prompt
            state.history = [systemMsg];
        },

        messageHistoryDropLast(state: MsgStore, _: PayloadAction<void>) {
            if (state.history[state.history.length - 1].role === 'user') {
                state.history = state.history.slice(0, -1);
            }
        }

    },
});

export const {
    streamingMessageClear,
    streamingMessageConcat,
    messageHistoryAddMessage,
    messageHistoryClear,
    messageHistoryDropLast,
} = msgStoreSlice.actions;


export type MessageStoreSlice = { [msgStoreSlice.name]: MsgStore };

export const selectMessageStore = (state: MessageStoreSlice) => state[msgStoreSlice.name];

export const selectStreamingMessage = createSelector(selectMessageStore, (state) => state.streamingMessage);

export const selectMessageHistory = createSelector(selectMessageStore, (state) => state.history);

export const selectHasToolCallInProgress = createSelector(selectMessageStore, (state) => {
    const lastMsg = state.history[state.history.length - 1];
    return lastMsg.role === 'assistant' && lastMsg.content === null && Array.isArray(lastMsg.tool_calls);
})

export const msgStoreReducer = msgStoreSlice.reducer;
