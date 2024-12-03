import { useSelector } from 'react-redux';
import {
    selectStreamingMessage,
} from '../../stores';
import styles from './style.module.css';
import { marked } from 'marked';


export const StreamingMessage = ({ chatContainerRef }: { chatContainerRef: React.RefObject<HTMLDivElement> }) => {
    const content = useSelector(selectStreamingMessage);
    if (!content) {
        return null;
    }


    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }

    let __html: string;
    try {
        __html = marked.parse(content, { async: false });
    } catch (err) {
        console.error(err);
        __html = content;
    }

    return <div data-testid='StreamingMessage' className={styles.chatBubbleAssistant}>
        <div className={styles.chatBubble} dangerouslySetInnerHTML={{ __html }} />
    </div>
};
