import { useRef } from 'react';
import styles from './style.module.css';
import { Messages } from './Messages';
import { PromptInput } from './PromptInput';
import { StreamingMessage } from './StreamingMessage';
import { useAppContext } from '../../contexts/AppContext';




export function Chat() {
    const { submitUserChatMessage, cancelStream } = useAppContext();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    return <div data-testid='Chat'>
        <div ref={chatContainerRef} className={styles.chatContainer} data-testid='ChatContainer'>
            <Messages />
            <StreamingMessage chatContainerRef={chatContainerRef} />
        </div>
        <PromptInput submitUserMessage={submitUserChatMessage} cancelStream={cancelStream} />
    </div>
};
