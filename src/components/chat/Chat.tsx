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
import styles from './style.module.css';
import type { ChatCompletionChunk } from 'openai/resources/index';
import { Messages, StreamingMessage } from './Messages';
import { PromptInput } from './PromptInput';


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

const onChatStreamToolCallRequest = (toolCalls: ChatCompletionChunk.Choice.Delta.ToolCall[]) => {
    console.info("tool_calls", toolCalls); // todo
};


export function Chat() {
    const dispatch = useDispatch();

    const [cancelStream, setCancelStream] = useState<null | (() => void)>(null);

    const handleSubmit = useCallback((inputContent: string) => {
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

    console.info('render: Chat');

    return <div>
        <div className={styles.chatContainer} id='chatContainer'>
            <Messages />
            <StreamingMessage />
        </div>
        <PromptInput submitUserMessage={handleSubmit} cancelStream={cancelStream} />
    </div>
};
