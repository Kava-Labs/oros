import { useSelector } from 'react-redux';
import {
    selectMessageHistory,
    selectStreamingMessage,
} from '../../stores';
import styles from './style.module.css';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { marked } from 'marked';

const INTRO_MESSAGE = `Hey I'm Kava AI. You can ask me any question. If you're here for the #KavaAI Launch Competition, try asking a question like "I want to deploy a memecoin on Kava with cool tokenomics".`;

export const Messages = () => {
    const history = useSelector(selectMessageHistory);

    return <>
        <StaticMessage role='assistant' content={INTRO_MESSAGE} />
        {
            history.map((msg, i) => {
                if (msg.role === 'assistant' || msg.role === 'user') {
                    return <StaticMessage key={i} role={msg.role} content={msg.content as string} />
                } else {
                    return null;
                }
            })
        }
    </>
};

export const StreamingMessage = () => {
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
