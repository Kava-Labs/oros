import styles from './Conversation.module.css';
import { ThinkingStream } from './ThinkingStream';
import { MessageStream } from './MessageStream';
import { ModelConfig } from '../../types/models';

interface AssistantStreamProps {
  onRendered: () => void;
  modelConfig: ModelConfig;
}

export const AssistantStream = ({
  onRendered,
  modelConfig,
}: AssistantStreamProps) => {
  return (
    <div id={styles.assistantStream}>
      <ThinkingStream onRendered={onRendered} modelConfig={modelConfig} />
      <MessageStream onRendered={onRendered} modelConfig={modelConfig} />
    </div>
  );
};
