import styles from './ChatHistory.module.css';
import { ConversationHistory } from '../context/types';
import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import NewChatIcon from '../assets/NewChatIcon';
import { useIsMobile } from '../../shared/theme/useIsMobile';

export const ChatHistory = () => {
  const [chatHistories, setChatHistories] = useState<ConversationHistory[]>([]);

  const { loadConversation, messageHistoryStore } = useAppContext();
  const isMobile = useIsMobile();

  const truncateTitle = useCallback((title: string) => {
    if (title.startsWith(`"`) || title.startsWith(`'`)) {
      title = title.slice(1);
    }
    if (title.endsWith(`"`) || title.endsWith(`'`)) {
      title = title.slice(0, -1);
    }
    if (title.length > 32) {
      title = title.slice(0, 32) + '....';
    }

    return title;
  }, []);

  useEffect(() => {
    const load = () => {
      setChatHistories(
        Object.values(
          JSON.parse(localStorage.getItem('conversations') ?? '{}'),
        ),
      );
    };
    load();
    // we have to poll local storage
    const id = setInterval(load, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const deleteConversation = useCallback((id: string) => {
    const allConversations = JSON.parse(
      localStorage.getItem('conversations') ?? '{}',
    );

    delete allConversations[id];

    localStorage.setItem('conversations', JSON.stringify(allConversations));
    setChatHistories(Object.values(allConversations));
  }, []);

  return (
    <div className={styles.chatHistoryContainer}>
      {!isMobile && (
        <button
          onClick={() => messageHistoryStore.reset()}
          className={styles.newChatButton}
          data-testid="new-chat-container-button"
        >
          <NewChatIcon />
          <p className={styles.newChatButtonText}>New Chat</p>
        </button>
      )}

      {/*  */}
      <div className={styles.historySection} data-testid="chat-history-section">
        <h5 className={styles.historySectionTitle}>History</h5>

        <div>
          {chatHistories.map((conversation) => {
            const { id, title } = conversation;
            return (
              <div
                data-testid="chat-history-entry"
                key={id}
                className={styles.chatHistoryItem}
              >
                <p onClick={() => loadConversation(conversation)}>
                  {truncateTitle(title)}
                </p>
                <div>
                  <svg
                    data-testid="delete-chat-history-entry-icon"
                    onClick={() => {
                      deleteConversation(id);
                    }}
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.54166 16.625C5.10624 16.625 4.7335 16.47 4.42343 16.1599C4.11336 15.8498 3.95832 15.4771 3.95832 15.0417V4.75H3.16666V3.16667H7.12499V2.375H11.875V3.16667H15.8333V4.75H15.0417V15.0417C15.0417 15.4771 14.8866 15.8498 14.5766 16.1599C14.2665 16.47 13.8937 16.625 13.4583 16.625H5.54166ZM13.4583 4.75H5.54166V15.0417H13.4583V4.75ZM7.12499 13.4583H8.70832V6.33333H7.12499V13.4583ZM10.2917 13.4583H11.875V6.33333H10.2917V13.4583Z"
                      fill="#B4B4B4"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
