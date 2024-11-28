import { describe, it, expect } from 'vitest';
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

            const nextState = msgStoreReducer(state, streamingMessageConcat('World!'));
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
            expect(newState.history[2]).toEqual({ role: 'assistant', content: 'Answer.' });
        });

        it('should not drop the last message if it is not from the user', () => {
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
            expect(newState.history).toHaveLength(3);
            expect(newState.history[2]).toEqual({ role: 'assistant', content: 'Hi there!' });
        });

        it('should handle history with only the system prompt', () => {
            const action = messageHistoryDropLast();
            const newState = msgStoreReducer(initialState, action);
            expect(newState.history).toHaveLength(1);
            expect(newState.history[0]).toEqual(initialState.history[0]);
        });

    });
});

describe('selectors', () => {
    const mockState = {
        msgStore: {
            history: [
                ...initialState.history,
                { role: 'user', content: 'Hello' },
            ],
            streamingMessage: 'Typing...',
        },
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
});
