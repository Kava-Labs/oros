import React from 'react';
import styles from './InputAdornmentMessage.module.css';
import ButtonIcon from './ButtonIcon';
import { X as CloseX } from 'lucide-react';

interface InputAdornmentMessageProps {
  onCloseClick: () => void;
  shouldDisableChat: boolean;
  startNewChat: () => void;
}

export const InputAdornmentMessage: React.FC<InputAdornmentMessageProps> = ({
  onCloseClick,
  shouldDisableChat,
  startNewChat,
}) => {
  const warningText = shouldDisableChat
    ? 'This conversation has exceeded the context limit'
    : 'This conversation is approaching the context limit';

  const bannerStyle = shouldDisableChat
    ? styles.warningBanner
    : styles.cautionBanner;

  //  don't give user option to close, only start new chat
  const closeIconStyle = shouldDisableChat
    ? styles.hiddenCloseIcon
    : styles.closeIcon;

  return (
    <div className={styles.wrapper}>
      <div className={bannerStyle}>
        <span className={styles.message}>{warningText}</span>
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
          className={closeIconStyle}
          onClick={onCloseClick}
          disabled={shouldDisableChat}
        />
      </div>
    </div>
  );
};
