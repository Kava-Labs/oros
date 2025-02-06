import { useRef } from 'react';
import styles from './ChatView.module.css';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { isInIframe } from '../utils/isInIframe';
import InputContainer from './InputContainer';
import ChatLanding from './ChatLanding';
import ResetChat from './ResetChat';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

export interface ChatViewProps {
  messages: ChatCompletionMessageParam[];
  cautionText: string;
  onSubmit(value: string): void;
  onReset(): void;
  onCancel(): void;
  introText: string;
}

export const ChatView = ({
  messages,
  cautionText,
  onSubmit,
  onReset,
  onCancel,
  introText,
}: ChatViewProps) => {
  const hasMessages =
    messages.filter((message) => message.role != 'system').length > 0;

  const containerRef = useRef<HTMLDivElement>(null);

  const showNavBar = !isInIframe() && FEAT_UPDATED_DESIGN;

  return (
    <div
      id={showNavBar ? styles.updatedChatView : styles.chatview}
      data-testid="chatview"
    >
      <div
        ref={containerRef}
        id={styles.scrollContent}
        data-testid="scrollContent"
      >
        {hasMessages && (
          <ResetChat
            containerRef={containerRef}
            onReset={onReset}
            messages={messages}
          />
        )}

        {!hasMessages && (
          <ChatLanding
            introText={introText}
            cautionText={cautionText}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        )}
      </div>

      {hasMessages && (
        <InputContainer
          onSubmit={onSubmit}
          onCancel={onCancel}
          cautionText={cautionText}
        />
      )}
    </div>
  );
};
