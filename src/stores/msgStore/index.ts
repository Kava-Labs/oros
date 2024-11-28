import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { systemPrompt } from '../../config';


export type MsgStore = {
    history: ChatCompletionMessageParam[];
    streamingMessage: '',
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
        }
    },
});

export const {
    streamingMessageClear,
    streamingMessageConcat,
    messageHistoryAddMessage,
    messageHistoryClear,
} = msgStoreSlice.actions;


export type MessageStoreSlice = { [msgStoreSlice.name]: MsgStore };

export const selectMessageStore = (state: MessageStoreSlice) => state[msgStoreSlice.name];

export const selectStreamingMessage = createSelector(selectMessageStore, (state) => state.streamingMessage);

export const selectMessageHistroy = createSelector(selectMessageStore, (state) => state.history);

export const msgStoreReducer = msgStoreSlice.reducer;
