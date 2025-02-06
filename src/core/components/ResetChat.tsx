import styles from './ChatView.module.css';
import { ResetChatIcon } from '../assets';
import { Conversation } from './Conversation';
import { RefObject, useCallback } from 'react';
import { useTheme } from '../../shared/theme/useTheme';
import type { ChatCompletionMessageParam } from 'openai/resources/index';

interface ResetChatProps {
  containerRef: RefObject<HTMLDivElement | null>;
  onReset(): void;
  messages: ChatCompletionMessageParam[];
}

const ResetChat = ({ containerRef, onReset, messages }: ResetChatProps) => {
  const handleContentRendered = useCallback(() => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [containerRef]);

  const { colors } = useTheme();
  return (
    <>
      <div id={styles.stickyHeader}>
        <button
          id={styles.resetButton}
          aria-label="Reset Chat"
          onClick={onReset}
        >
          <ResetChatIcon color={colors.accentTransparent} />
        </button>
      </div>

      <Conversation messages={messages} onRendered={handleContentRendered} />
    </>
  );
};

export default ResetChat;
