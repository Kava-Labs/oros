import styles from './ChatHistory.module.css';
import { ConversationHistory } from '../context/types';
import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import NewChatIcon from '../assets/NewChatIcon';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { Trash2 } from 'lucide-react';

interface ChatHistoryProps {
  setChatHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatHistory = ({ setChatHistoryOpen }: ChatHistoryProps) => {
  const [chatHistories, setChatHistories] = useState<ConversationHistory[]>([]);

  const { loadConversation, messageHistoryStore, modelConfig } =
    useAppContext();
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

  //  todo - refactor duplicate code in NavBar
  const startNewChat = useCallback(() => {
    messageHistoryStore.reset();
    messageHistoryStore.addMessage({
      role: 'system' as const,
      content: modelConfig.systemPrompt,
    });
  }, [messageHistoryStore, modelConfig.systemPrompt]);

  const deleteConversation = useCallback(
    (id: string) => {
      const allConversations = JSON.parse(
        localStorage.getItem('conversations') ?? '{}',
      );

      if (
        allConversations[id] &&
        id === messageHistoryStore.getConversationID()
      ) {
        startNewChat();
      }

      delete allConversations[id];

      localStorage.setItem('conversations', JSON.stringify(allConversations));
      setChatHistories(Object.values(allConversations));
    },
    [messageHistoryStore, startNewChat],
  );

  const handleChatHistoryClick = (conversation: ConversationHistory) => {
    loadConversation(conversation);
    setChatHistoryOpen(false);
  };

  return (
    <div className={styles.chatHistoryContainer}>
      {!isMobile && (
        <button
          onClick={startNewChat}
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
                <p onClick={() => handleChatHistoryClick(conversation)}>
                  {truncateTitle(title)}
                </p>
                <div className={styles.trashIconContainer}>
                  <Trash2
                    data-testid="delete-chat-history-entry-icon"
                    width="19px"
                    height="19px"
                    onClick={() => deleteConversation(id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
