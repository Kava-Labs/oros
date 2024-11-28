import { useCallback, useState } from 'react';
import { batch, useDispatch } from 'react-redux';
import {
    appStore,
    messageHistoryAddMessage,
    messageHistoryDropLast,
    selectMessageHistory,
    selectStreamingMessage,
    streamingMessageClear,
    streamingMessageConcat
} from '../../stores';
import { chat as doChat } from '../../utils';
import { tools } from '../../config';
import type { ChatCompletionChunk, ChatCompletionMessageToolCall } from 'openai/resources/index';
import { getAccountBalances, sendKava, transactionToolCallFunctionNames, transferERC20 } from '../../tools/toolFunctions';


export function useChat() {
    const dispatch = useDispatch();

    const [cancelStream, setCancelStream] = useState<null | (() => void)>(null);

    const submitChatMessage = useCallback((inputContent: string) => {
        if (!inputContent.length) return;
        // add to history 
        dispatch(messageHistoryAddMessage({ role: 'user', content: inputContent }));
        // submit request with updated history 
        const cancelFN = doChat({
            tools,
            model: 'gpt-4',
            messages: selectMessageHistory(appStore.getState()),
            onData: onChatStreamData,
            onDone: () => { onChatStreamDone(); setCancelStream(null); },
            onToolCallRequest: onChatStreamToolCallRequest,
        });

        setCancelStream(() => {
            return () => {
                cancelFN();

                batch(() => {
                    dispatch(streamingMessageClear());
                    dispatch(messageHistoryDropLast());
                })

                setCancelStream(null);
            }
        })



    }, [dispatch]);

    return {
        submitChatMessage,
        cancelStream,
    }
};

const onChatStreamData = (chunk: string) => {
    // store each chunk in redux as we get it
    // StreamingMessage is subscribed to this and will rerender on each new chunk
    appStore.dispatch(streamingMessageConcat(chunk));
};

const onChatStreamDone = () => {
    const content = selectStreamingMessage(appStore.getState());
    if (content) {
        batch(() => {
            // add the new message we received from the model to history
            // clear streamingMessage since the request is done
            appStore.dispatch(messageHistoryAddMessage({ role: 'assistant', content: content }));
            appStore.dispatch(streamingMessageClear());
        })
    }
};

const doToolCall = async (tc: ChatCompletionChunk.Choice.Delta.ToolCall, tcFunction: (arg: any) => Promise<any>) => {
    const args = tc.function?.arguments as any;
    appStore.dispatch(messageHistoryAddMessage({
        role: 'assistant',
        function_call: null,
        content: null,
        tool_calls: [{ id: tc.id, function: tc.function, type: "function" } as ChatCompletionMessageToolCall]
    }));

    let results: any;

    let tcError = false;
    try {
        results = await tcFunction(JSON.parse(args));
    } catch (err) {
        tcError = true;
        results = err;
    }

    if (!tcError && transactionToolCallFunctionNames.includes(tc.function?.name as string)) {
        try {
            results = await window.ethereum.request(results);
        } catch (err) {
            console.error(err);
            results = err;
        }
    }

    appStore.dispatch(messageHistoryAddMessage({
        role: "tool",
        content: JSON.stringify(results),
        // @ts-ignore
        tool_call_id: tc.id,
    }));

    doChat({
        tools,
        model: 'gpt-4',
        messages: selectMessageHistory(appStore.getState()),
        onData: onChatStreamData,
        onDone: onChatStreamDone,
        onToolCallRequest: onChatStreamToolCallRequest,
    });

};

const onChatStreamToolCallRequest = (toolCalls: ChatCompletionChunk.Choice.Delta.ToolCall[]) => {
    (async () => {
        for (const tc of toolCalls) {
            const name = tc.function?.name;
            switch (name) {
                case "getAccountBalances":
                    console.info("getAccountBalances");
                    await doToolCall(tc, getAccountBalances);
                    break;
                case "sendKava":
                    console.info("sendKava");
                    await doToolCall(tc, sendKava);
                    break;
                case "transferERC20":
                    console.info("transferERC20");
                    await doToolCall(tc, transferERC20);
                    break;
                default:
                    throw new Error(`unknown tool call function: ${tc.function?.name}`);
            }

        }

    })()

};

