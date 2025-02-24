import React from 'react';
import styles from './InputAdornmentMessage.module.css';
import ButtonIcon from './ButtonIcon';
import { X as CloseX } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';

interface NewChatPromptProps {
  showInputAdornmentMessage: boolean;
  setShowInputAdornmentMessage: (show: boolean) => void;
}

export const InputAdornmentMessage: React.FC<NewChatPromptProps> = ({
  showInputAdornmentMessage,
  setShowInputAdornmentMessage,
}) => {
  const { startNewChat } = useAppContext();

  if (!showInputAdornmentMessage) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.banner}>
        <span className={styles.message}>
          This conversation has exceeded the context limit
        </span>
        <button
          onClick={startNewChat}
          aria-label="Start New Chat Button"
          className={styles.newChatButton}
        >
          Start new chat
        </button>
        <ButtonIcon
          icon={CloseX}
          size={12}
          aria-label="Close New Chat Prompt"
          className={styles.closeIcon}
          onClick={() => setShowInputAdornmentMessage(false)}
        />
      </div>
    </div>
  );
};
