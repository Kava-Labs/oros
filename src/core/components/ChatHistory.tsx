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

  const {
    loadConversation,
    messageHistoryStore,
    modelConfig,
    setIsRequesting,
  } = useAppContext();
  const isMobile = useIsMobile();

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
    setIsRequesting(false);
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
          {chatHistories.map((conversation) => (
            <HistoryItem
              conversation={conversation}
              handleChatHistoryClick={handleChatHistoryClick}
              deleteConversation={deleteConversation}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const HistoryItem = ({
  conversation,
  handleChatHistoryClick,
  deleteConversation,
}: {
  conversation: ConversationHistory;
  handleChatHistoryClick: (conversation: ConversationHistory) => void;
  deleteConversation: (id: string) => void;
}) => {
  const { id, title } = conversation;

  const isMobile = useIsMobile();

  const [hover, setHover] = useState(false);

  const truncateTitle = (title: string) => {
    const threshold = hover ? 32 : 36;

    if (title.startsWith(`"`) || title.startsWith(`'`)) {
      title = title.slice(1);
    }
    if (title.endsWith(`"`) || title.endsWith(`'`)) {
      title = title.slice(0, -1);
    }
    if (title.length > threshold) {
      title = title.slice(0, threshold) + '....';
    }

    return title;
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-testid="chat-history-entry"
      key={id}
      className={styles.chatHistoryItem}
    >
      <p onClick={() => handleChatHistoryClick(conversation)}>
        {truncateTitle(title)}
      </p>
      <div>
        {hover || isMobile ? (
          <Trash2
            data-testid="delete-chat-history-entry-icon"
            width="19px"
            height="19px"
            onClick={() => deleteConversation(id)}
          />
        ) : null}
      </div>
    </div>
  );
};
