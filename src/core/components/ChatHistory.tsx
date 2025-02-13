import styles from './ChatHistory.module.css';
import { ConversationHistory } from '../context/types';
import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  memo,
  Dispatch,
  SetStateAction,
} from 'react';
import { useAppContext } from '../context/useAppContext';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { TrashIcon } from '../assets/TrashIcon';
import { Pencil, Trash2 } from 'lucide-react';
import {
  formatConversationTitle,
  groupConversationsByTime,
} from '../utils/conversation/helpers';
import ButtonIcon from './ButtonIcon';

interface ChatHistoryProps {
  onHistoryItemClick: Dispatch<SetStateAction<boolean>>;
  startNewChat(): void;
}

export const ChatHistory = ({
  onHistoryItemClick,
  startNewChat,
}: ChatHistoryProps) => {
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const { loadConversation, messageHistoryStore } = useAppContext();

  useEffect(() => {
    const load = () => {
      const storedConversations = Object.values(
        JSON.parse(localStorage.getItem('conversations') ?? '{}'),
      ) as ConversationHistory[];
      setConversations(storedConversations);
    };
    load();
    // we have to poll local storage
    const id = setInterval(load, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const groupedHistories = useMemo(
    () => groupConversationsByTime(conversations),
    [conversations],
  );

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
      setConversations(Object.values(allConversations));
    },
    [messageHistoryStore, startNewChat],
  );

  const handleChatHistoryClick = useCallback(
    (conversation: ConversationHistory) => {
      loadConversation(conversation);
      onHistoryItemClick(false);
    },
    [loadConversation, onHistoryItemClick],
  );

  return (
    <div className={styles.chatHistoryContainer}>
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

const HistoryItem = memo(
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

    // *******************
    const [editingTitle, setEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(title);

    useEffect(() => {
      let tid: NodeJS.Timeout;
      if (newTitle !== title) {
        // user changed the title
        // save to local storage
        const conversations = JSON.parse(
          localStorage.getItem('conversations') ?? '{}',
        );
        conversations[id].title = newTitle;
        localStorage.setItem('conversations', JSON.stringify(conversations));
        tid = setTimeout(() => {
          // after saving, wait a bit and kick user out of editing state
          setEditingTitle(false);
        }, 1000);
      } else if (editingTitle) {
        // user clicked to edit title but made no changes
        // after some time reset the edit state back to false
        tid = setTimeout(() => {
          setEditingTitle(false);
        }, 5000);
      }

      return () => {
        if (tid) {
          clearTimeout(tid);
        }
      };
    }, [newTitle, title, id, editingTitle]);

    const truncatedTitle = useMemo(
      () => formatConversationTitle(newTitle, hover ? 30 : 34),
      [newTitle, hover],
    );

    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-testid="chat-history-entry"
        className={`${styles.chatHistoryItem} ${isSelected ? styles.selected : ''}`}
      >
        <div className={styles.chatHistoryContent}>
          {!editingTitle ? (
            <p
              onClick={() => handleChatHistoryClick(conversation)}
              className={styles.chatHistoryTitle}
            >
              {truncatedTitle}
            </p>
          ) : (
            <input
              data-testid="edit-chat-history-title-input"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              className={styles.chatHistoryTitleInput}
              onKeyDown={({ key }) => {
                if (key === 'Enter') setEditingTitle(false);
              }}
            />
          )}
        </div>
        <div className={styles.iconsContainer}>
          {(hover || isMobile) && !editingTitle ? (
            <>
              <ButtonIcon
                icon={Pencil}
                size={18}
                tooltip={{
                  text: 'Edit Title',
                  position: 'bottom',
                }}
                aria-label="Edit Title"
                onClick={() => setEditingTitle(true)}
              />

              <div className={styles.deleteIcon} />

              <ButtonIcon
                data-testid="delete-chat-history-entry-icon"
                icon={Trash2}
                size={18}
                tooltip={{
                  text: 'Delete Chat',
                  position: 'bottom',
                }}
                aria-label="Delete Chat"
                onClick={() => deleteConversation(id)}
              />
            </>
          ) : null}
        </div>
      </div>
    );
  },
);

export default ChatHistory;
