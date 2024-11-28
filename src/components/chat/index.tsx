import { useRef } from 'react';
import styles from './style.module.css';
import { Messages } from './Messages';
import { PromptInput } from './PromptInput';
import { StreamingMessage } from './StreamingMessage';
import { useChat } from './useChat';



export function Chat() {
    const { submitChatMessage, cancelStream } = useChat();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    console.info('render: Chat');

    return <div>
        <div ref={chatContainerRef} className={styles.chatContainer} id='chatContainer'>
            <Messages />
            <StreamingMessage chatContainerRef={chatContainerRef} />
        </div>
        <PromptInput submitUserMessage={submitChatMessage} cancelStream={cancelStream} />
    </div>
};
