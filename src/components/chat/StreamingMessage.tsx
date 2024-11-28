import { useSelector } from 'react-redux';
import {
    selectStreamingMessage,
} from '../../stores';
import styles from './style.module.css';
import { marked } from 'marked';


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
