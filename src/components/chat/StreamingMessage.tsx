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

    console.info('render: StreamingMessage');

    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }


    return <div className={styles.chatBubbleAssistant}>
        <div className={styles.chatBubble} dangerouslySetInnerHTML={{ __html: marked.parse(content, { async: false }) }} />
    </div>
};
