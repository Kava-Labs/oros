import styles from './Conversation.module.css';
import { ThinkingStream } from './ThinkingStream';
import { MessageStream } from './MessageStream';

interface AssistantStreamProps {
  onRendered: () => void;
}

export const AssistantStream = ({ onRendered }: AssistantStreamProps) => {
  return (
    <div id={styles.assistantStream}>
      <ThinkingStream onRendered={onRendered} />
      <MessageStream onRendered={onRendered} />
    </div>
  );
};
