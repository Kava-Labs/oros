import { useCallback, useState } from 'react';
import { batch, useDispatch, useSelector } from 'react-redux';
import {
    appStore,
    messageHistoryAddMessage,
    selectMessageHistroy,
    selectStreamingMessage,
    streamingMessageClear,
    streamingMessageConcat
} from '../../stores';
import { chat as doChat } from '../../utils';
import { tools } from '../../config';
import styles from './style.module.css';
import type { ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources/index';
import { marked } from 'marked';

const INTRO_MESSAGE = `Hey I'm Kava AI. You can ask me any question. If you're here for the #KavaAI Launch Competition, try asking a question like "I want to deploy a memecoin on Kava with cool tokenomics".`;


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
    console.info(`tool_calls: ${toolCalls}`); // todo
};


export const Chat = () => {
    const dispatch = useDispatch();

    const handleSubmit = useCallback((inputContent: string) => {
        if (!inputContent.length) return;
        // add to history 
        dispatch(messageHistoryAddMessage({ role: 'user', content: inputContent }));
        // submit request with updated history 
        doChat({
            tools,
            model: 'gpt-4',
            messages: selectMessageHistroy(appStore.getState()),
            onData: onChatStreamData,
            onDone: onChatStreamDone,
            onToolCallRequest: onChatStreamToolCallRequest,
        });

    }, [dispatch]);

    console.info('render: Chat');

    const messageHistory = useSelector(selectMessageHistroy);

    return <div>
        <div className={styles.chatContainer} id='chatContainer'>
            <StaticMessage role='assistant' content={INTRO_MESSAGE} />
            {
                messageHistory.map((msg, i) => {
                    if (msg.role === 'assistant' || msg.role === 'user') {
                        return <StaticMessage key={i} role={msg.role} content={msg.content as string} />
                    } else {
                        return null;
                    }
                })
            }
            <StreamingMessage />
        </div>
        <PromptArea submitUserMessage={handleSubmit} />
    </div>
};


const markDownCache = new Map<string, string>();

const StaticMessage = (props: ChatCompletionMessageParam) => {
    const content = props.content as string;
    const role = props.role;
    let __html: string | undefined;
    if (role === 'assistant') {
        // save the markdown if cache miss 
        if (!(__html = markDownCache.get(content))) {
            __html = marked.parse(content, { async: false });
            markDownCache.set(content, __html);
        }
    } else {
        __html = content; // keep user message as is
    }

    return <div className={role === 'assistant' ? styles.chatBubbleAssistant : styles.chatBubbleUser}>
        <div className={styles.chatBubble} dangerouslySetInnerHTML={{ __html }} />
    </div>
};

const StreamingMessage = () => {
    const content = useSelector(selectStreamingMessage);
    if (!content) {
        return null;
    }

    console.info('render: StreamingMessage');

    const chatContainer = document.getElementById('chatContainer')!;
    chatContainer.scrollTop = chatContainer.scrollHeight;


    return <div className={styles.chatBubbleAssistant}>
        <div className={styles.chatBubble} dangerouslySetInnerHTML={{ __html: marked.parse(content, { async: false }) }} />
    </div>
};



const PromptArea = ({ submitUserMessage }: { submitUserMessage: (content: string) => void }) => {
    const [input, setInput] = useState('');

    return (
        <form
            className={styles.promptForm}
            onSubmit={(e) => {
                e.preventDefault();
                submitUserMessage(input);
                setInput('');
            }}
        >
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your prompt here..."
                className={styles.inputField}
            />
            <button type="submit" className={styles.submitButton} onClick={(e) => { e.preventDefault(); submitUserMessage(input); setInput('') }}>
                Submit
            </button>
        </form>
    );
};
