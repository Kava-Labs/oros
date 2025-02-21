import React from 'react';
import styles from './NewChatPrompt.module.css';

interface NewChatPromptProps {
  onShowNewChatPrompt?: boolean;
}

export const NewChatPrompt: React.FC<NewChatPromptProps> = ({
  onShowNewChatPrompt = true,
}) => {
  if (!onShowNewChatPrompt) return null;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div className={styles.banner}>
        <span className={styles.message}>
          This conversation has exceeded the context limit
        </span>
        <button className={styles.newChatButton}>Start a new chat</button>
        <button className={styles.closeButton}>×</button>
      </div>
    </div>
  );
};
