import styles from './ChatHistory.module.css';
import { ConversationHistory } from '../context/types';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useAppContext } from '../context/useAppContext';
import NewChatIcon from '../assets/NewChatIcon';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { TrashIcon } from '../assets/TrashIcon';
import KavaAILogo from '../assets/KavaAILogo';

interface ChatHistoryProps {
  setChatHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type GroupedConversations = {
  [key: string]: ConversationHistory[];
};

const getTimeGroup = (timestamp: number): string => {
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - timestamp) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last week';
  if (diffDays <= 14) return '2 weeks ago';
  if (diffDays <= 21) return '3 weeks ago';
  if (diffDays <= 28) return '4 weeks ago';
  if (diffDays <= 60) return 'Last month';
  if (diffDays <= 90) return '2 months ago';

  const months = Math.floor(diffDays / 30);
  return `${months} months ago`;
};

const groupConversations = (
  conversations: ConversationHistory[],
): GroupedConversations => {
  const sortedConversations = [...conversations].sort(
    (a, b) => b.lastSaved - a.lastSaved,
  );

  return sortedConversations.reduce((groups, conversation) => {
    const timeGroup = getTimeGroup(conversation.lastSaved);
    if (!groups[timeGroup]) {
      groups[timeGroup] = [];
    }
    groups[timeGroup].push(conversation);
    return groups;
  }, {} as GroupedConversations);
};

export const ChatHistory = ({ setChatHistoryOpen }: ChatHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const {
    loadConversation,
    messageHistoryStore,
    modelConfig,
    setIsRequesting,
  } = useAppContext();
  const isMobile = useIsMobile();

  useEffect(() => {
    const load = () => {
      const storedConversations = JSON.parse(
        localStorage.getItem('conversations') ?? '{}',
      );
      setConversations(Object.values(storedConversations));
    };
    load();
    // we have to poll local storage
    const id = setInterval(load, 1000);

    return () => clearInterval(id);
  }, []);

  const groupedHistories = useMemo(() => {
    const filteredConversations = conversations.filter((c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return groupConversations(filteredConversations);
  }, [conversations, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const startNewChat = useCallback(() => {
    messageHistoryStore.reset();
    messageHistoryStore.addMessage({
      role: 'system' as const,
      content: modelConfig.systemPrompt,
    });
    setIsRequesting(false);
  }, [messageHistoryStore, modelConfig.systemPrompt, setIsRequesting]);

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
      setConversations(Object.values(allConversations));
    },
    [messageHistoryStore, startNewChat],
  );

  const handleChatHistoryClick = useCallback(
    (conversation: ConversationHistory) => {
      loadConversation(conversation);
      setChatHistoryOpen(false);
    },
    [loadConversation, setChatHistoryOpen],
  );

  return (
    <div className={styles.chatHistoryContainer}>
      {!isMobile && (
        <div className={styles.desktopLogo}>
          <KavaAILogo />
        </div>
      )}
      {!isMobile && (
        <button
          onClick={startNewChat}
          className={styles.newChatButton}
          data-testid="new-chat-container-button"
        >
          <div className={styles.newChatButtonAlignment}>
            <NewChatIcon />
            <input
              onChange={handleSearchChange}
              value={searchTerm}
              placeholder="Search conversations..."
            />
            <p className={styles.newChatButtonText}>New Chat</p>
          </div>
        </button>
      )}

      <div data-testid="chat-history-section">
        {Object.entries(groupedHistories).map(
          ([timeGroup, groupConversations]) => (
            <div key={timeGroup} className={styles.timeGroup}>
              <h6 className={styles.timeGroupTitle}>{timeGroup}</h6>
              <div className={styles.timeGroupContent}>
                {groupConversations.map((conversation) => (
                  <HistoryItem
                    key={conversation.id}
                    conversation={conversation}
                    handleChatHistoryClick={handleChatHistoryClick}
                    deleteConversation={deleteConversation}
                  />
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
};
interface HistoryItemProps {
  conversation: ConversationHistory;
  handleChatHistoryClick: (conversation: ConversationHistory) => void;
  deleteConversation: (id: string) => void;
}

const HistoryItem = React.memo(
  ({
    conversation,
    handleChatHistoryClick,
    deleteConversation,
  }: HistoryItemProps) => {
    const { id, title } = conversation;
    const isMobile = useIsMobile();
    const [hover, setHover] = useState(false);
    const { messageHistoryStore } = useAppContext();
    const isSelected = messageHistoryStore.getConversationID() === id;

    const truncateTitle = useCallback(
      (title: string) => {
        const threshold = hover ? 32 : 36;
        let processedTitle = title;

        if (processedTitle.startsWith(`"`) || processedTitle.startsWith(`'`)) {
          processedTitle = processedTitle.slice(1);
        }
        if (processedTitle.endsWith(`"`) || processedTitle.endsWith(`'`)) {
          processedTitle = processedTitle.slice(0, -1);
        }
        if (processedTitle.length > threshold) {
          processedTitle = processedTitle.slice(0, threshold) + '....';
        }

        return processedTitle;
      },
      [hover],
    );

    const truncatedTitle = useMemo(
      () => truncateTitle(title),
      [title, truncateTitle],
    );

    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-testid="chat-history-entry"
        className={`${styles.chatHistoryItem} ${isSelected ? styles.selected : ''}`}
      >
        <div className={styles.chatHistoryContent}>
          <p
            onClick={() => handleChatHistoryClick(conversation)}
            className={styles.chatHistoryTitle}
          >
            {truncatedTitle}
          </p>
        </div>
        <div className={styles.trashIconContainer}>
          {(hover || isMobile) && (
            <TrashIcon
              data-testid="delete-chat-history-entry-icon"
              width="19px"
              height="19px"
              onClick={() => deleteConversation(id)}
            />
          )}
        </div>
      </div>
    );
  },
);

HistoryItem.displayName = 'HistoryItem';
