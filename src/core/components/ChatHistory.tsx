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
  useRef,
} from 'react';
import { EllipsisVertical, Bot, Pencil, Trash2, X } from 'lucide-react';
import { groupConversationsByTime } from '../utils/conversation/helpers';
import ButtonIcon from './ButtonIcon';

interface ChatHistoryProps {
  conversationID: string;
  onHistoryItemClick: Dispatch<SetStateAction<boolean>>;
  startNewChat: () => void;
  loadConversation: (conversationHistory: ConversationHistory) => void;
  conversations: ConversationHistory[];
}

export const ChatHistory = ({
  conversationID,
  onHistoryItemClick,
  startNewChat,
  loadConversation,
  conversations,
}: ChatHistoryProps) => {
  const conversationsToRecord = (convs: ConversationHistory[]) => {
    const record: Record<string, ConversationHistory> = {};
    convs.forEach((conv) => (record[conv.id] = conv));
    return record;
  };

  // Keep local state synced with localStorage
  const [localConversations, setLocalConversations] = useState(() =>
    conversationsToRecord(conversations),
  );

  const hasLocalConversations = Object.keys(localConversations).length > 0;

  useEffect(() => {
    setLocalConversations(conversationsToRecord(conversations));
  }, [conversations]);

  const groupedHistories = useMemo(
    () => groupConversationsByTime(Object.values(localConversations)),
    [localConversations],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      // First, update the UI by removing the conversation from local state
      setLocalConversations((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      if (id === conversationID) {
        startNewChat();
      }

      // Then, defer the localStorage update
      Promise.resolve().then(() => {
        try {
          const allConversations = JSON.parse(
            localStorage.getItem('conversations') ?? '{}',
          ) as Record<string, ConversationHistory>;

          delete allConversations[id];
          localStorage.setItem(
            'conversations',
            JSON.stringify(allConversations),
          );
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      });

      setOpenMenuId(null);
    },
    [startNewChat, conversationID],
  );

  const handleChatHistoryClick = useCallback(
    (conversation: ConversationHistory) => {
      loadConversation(conversation);
      onHistoryItemClick(false);
    },
    [loadConversation, onHistoryItemClick],
  );

  // Single state for tracking which menu is open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className={styles.chatHistoryContainer}>
      <div data-testid="chat-history-section">
        {!hasLocalConversations ? (
          <div className={styles.emptyState}>
            <Bot className={styles.emptyStateIcon} size={24} />
            <small className={styles.emptyStateText}>
              Start a new chat to begin
            </small>
          </div>
        ) : (
          Object.entries(groupedHistories).map(([timeGroup, conversations]) => (
            <div key={timeGroup} className={styles.timeGroup}>
              <small className={styles.timeGroupTitle}>{timeGroup}</small>
              <div className={styles.timeGroupContent}>
                {conversations.map((conversation) => (
                  <HistoryItem
                    key={conversation.id}
                    conversationID={conversationID}
                    conversation={conversation}
                    handleChatHistoryClick={handleChatHistoryClick}
                    deleteConversation={deleteConversation}
                    isMenuOpen={openMenuId === conversation.id}
                    onMenuClick={() => {
                      // First set the new menu ID, then close the old one
                      const newMenuId =
                        openMenuId === conversation.id ? null : conversation.id;
                      requestAnimationFrame(() => {
                        setOpenMenuId(newMenuId);
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface HistoryItemProps {
  conversation: ConversationHistory;
  handleChatHistoryClick: (conversation: ConversationHistory) => void;
  deleteConversation: (id: string) => void;
  isMenuOpen: boolean;
  onMenuClick: () => void;
  conversationID: string;
}

const HistoryItem = memo(
  ({
    conversation,
    handleChatHistoryClick,
    deleteConversation,
    isMenuOpen,
    onMenuClick,
    conversationID,
  }: HistoryItemProps) => {
    const { id, title } = conversation;
    const isSelected = conversationID === id;
    const [editingTitle, setEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(title);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleMenuClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (editingTitle) {
        setEditingTitle(false);
        setNewTitle(title);
      }
      onMenuClick();
    };

    const saveToLocalStorage = useCallback(
      (newValue: string) => {
        const conversations = JSON.parse(
          localStorage.getItem('conversations') ?? '{}',
        );
        conversations[id].title = newValue;
        localStorage.setItem('conversations', JSON.stringify(conversations));
      },
      [id],
    );

    const [didEditTitle, setDidEditTitle] = useState(false);

    const handleSaveTitle = useCallback(() => {
      const trimmedTitle = newTitle.trim();
      if (trimmedTitle === '') {
        setNewTitle(title);
        return;
      }
      if (trimmedTitle !== title) {
        setDidEditTitle(true);
      }

      if (trimmedTitle !== title) {
        setDidEditTitle(true);
      }

      //  Update UI first
      setNewTitle(trimmedTitle);
      setEditingTitle(false);

      //  Defer storage update
      //  Updating long history in local storage first
      //  and then updating the UI can cause a lag
      Promise.resolve().then(() => {
        try {
          saveToLocalStorage(trimmedTitle);
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      });
    }, [newTitle, title, saveToLocalStorage]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        // Don't handle click outside when clicking menu buttons
        const isMenuButtonClick = (target as Element).closest(
          '[data-menu-button="true"]',
        );
        if (isMenuButtonClick) return;

        if (containerRef.current && !containerRef.current.contains(target)) {
          if (editingTitle) {
            handleSaveTitle();
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [editingTitle, handleSaveTitle]);

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteConversation(id);
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingTitle) {
        setNewTitle(title);
        setEditingTitle(false);
      } else {
        // Get the latest title from localStorage when entering edit mode
        const conversations = JSON.parse(
          localStorage.getItem('conversations') ?? '{}',
        );
        const currentTitle = conversations[id]?.title ?? title;
        setNewTitle(currentTitle);
        setEditingTitle(true);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        handleSaveTitle();
      } else if (e.key === 'Escape') {
        setNewTitle(title);
        setEditingTitle(false);
      }
    };

    useEffect(() => {
      if (editingTitle) {
        const conversations = JSON.parse(
          localStorage.getItem('conversations') ?? '{}',
        );
        const currentTitle = conversations[id]?.title ?? title;
        setNewTitle(currentTitle);

        const input = inputRef.current;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }, [editingTitle, id, title]);

    return (
      <div
        ref={containerRef}
        className={`${styles.chatHistoryItem} ${isSelected ? styles.selected : ''}`}
      >
        <div className={styles.chatHistoryContent}>
          <div
            className={styles.titleContainer}
            onClick={() => handleChatHistoryClick(conversation)}
          >
            {editingTitle ? (
              <input
                ref={inputRef}
                type="text"
                value={newTitle}
                role="Edit Title Input"
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.chatHistoryTitleInput}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            ) : (
              <small data-testid="chat-history-entry">
                {didEditTitle ? newTitle : title}
              </small>
            )}
          </div>
          <ButtonIcon
            className={styles.menuIcon}
            icon={EllipsisVertical}
            size={20}
            data-menu-button="true"
            aria-label="Chat Options"
            onClick={handleMenuClick}
          />
        </div>
        <div
          className={`${styles.buttonContainer} ${isMenuOpen ? styles.show : ''}`}
        >
          <button
            className={styles.menuButton}
            onClick={handleEdit}
            aria-label={editingTitle ? 'Cancel Rename Title' : 'Rename Title'}
          >
            {editingTitle ? (
              <>
                <X size={16} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Pencil size={16} />
                <span>Rename</span>
              </>
            )}
          </button>
          <button
            className={`${styles.menuButton} ${styles.deleteButton}`}
            data-delete="true"
            onClick={handleDelete}
            aria-label="Delete Chat"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  },
);

export default ChatHistory;
