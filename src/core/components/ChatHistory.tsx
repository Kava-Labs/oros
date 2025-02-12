import styles from './ChatHistory.module.css';
import { ConversationHistory } from '../context/types';
import { useCallback, useEffect, useState } from 'react';
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

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return 'Last week';
  } else if (diffDays <= 14) {
    return '2 weeks ago';
  } else if (diffDays <= 21) {
    return '3 weeks ago';
  } else if (diffDays <= 28) {
    return '4 weeks ago';
  } else if (diffDays <= 60) {
    return 'Last month';
  } else if (diffDays <= 90) {
    return '2 months ago';
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} months ago`;
  }
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
  const [groupedHistories, setGroupedHistories] =
    useState<GroupedConversations>({});

  const {
    loadConversation,
    messageHistoryStore,
    modelConfig,
    setIsRequesting,
  } = useAppContext();
  const isMobile = useIsMobile();

  useEffect(() => {
    const load = () => {
      const conversations = Object.values(
        JSON.parse(localStorage.getItem('conversations') ?? '{}'),
      ) as ConversationHistory[];
      setGroupedHistories(groupConversations(conversations));
    };
    load();
    // we have to poll local storage
    const id = setInterval(load, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  //  todo -refactor duplicate code in NavBar
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
      ) as Record<string, ConversationHistory>;

      if (
        allConversations[id] &&
        id === messageHistoryStore.getConversationID()
      ) {
        startNewChat();
      }

      delete allConversations[id];

      localStorage.setItem('conversations', JSON.stringify(allConversations));
      setGroupedHistories(groupConversations(Object.values(allConversations)));
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
            <p className={styles.newChatButtonText}>New Chat</p>
          </div>
        </button>
      )}

      <div data-testid="chat-history-section">
        {Object.entries(groupedHistories).map(([timeGroup, conversations]) => (
          <div key={timeGroup} className={styles.timeGroup}>
            <h6 className={styles.timeGroupTitle}>{timeGroup}</h6>
            <div className={styles.timeGroupContent}>
              {conversations.map((conversation) => (
                <HistoryItem
                  key={conversation.id}
                  conversation={conversation}
                  handleChatHistoryClick={handleChatHistoryClick}
                  deleteConversation={deleteConversation}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
interface HistoryItemProps {
  conversation: ConversationHistory;
  handleChatHistoryClick: (conversation: ConversationHistory) => void;
  deleteConversation: (id: string) => void;
}

const HistoryItem = ({
  conversation,
  handleChatHistoryClick,
  deleteConversation,
}: HistoryItemProps) => {
  const { id, title } = conversation;
  const isMobile = useIsMobile();
  const [hover, setHover] = useState(false);

  const { messageHistoryStore } = useAppContext();
  const isSelected = messageHistoryStore.getConversationID() === id;

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
      className={`${styles.chatHistoryItem} ${isSelected ? styles.selected : ''}`}
    >
      <div className={styles.chatHistoryContent}>
        <p
          onClick={() => handleChatHistoryClick(conversation)}
          className={styles.chatHistoryTitle}
        >
          {truncateTitle(title)}
        </p>
      </div>
      <div className={styles.trashIconContainer}>
        {hover || isMobile ? (
          <TrashIcon
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
