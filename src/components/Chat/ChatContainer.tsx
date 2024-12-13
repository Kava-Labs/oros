import { useRef } from 'react';
import styles from './style.module.css';
import { Messages } from './Messages';
import { PromptInput } from './PromptInput';
import { StreamingMessage } from './StreamingMessage';
import { useAppContext } from '../../contexts/AppContext';
import { useMessageHistoryStore } from '../../stores';

export const ChatContainer = () => {
  const { submitUserChatMessage, cancelStream } = useAppContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [history] = useMessageHistoryStore();

  return (
    <div data-testid="Chat">
      <div
        ref={chatContainerRef}
        className={styles.chatContainer}
        data-testid="ChatContainer"
      >
        <Messages history={history} />
        <StreamingMessage chatContainerRef={chatContainerRef} />
      </div>
      <PromptInput
        submitUserMessage={submitUserChatMessage}
        cancelStream={cancelStream}
      />
    </div>
  );
};
