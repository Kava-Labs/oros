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
import { useAppContext } from '../context/useAppContext';
import { EllipsisVertical, Bot, Pencil, Trash2, X } from 'lucide-react';
import { groupConversationsByTime } from '../utils/conversation/helpers';
import ButtonIcon from './ButtonIcon';
import _ from 'lodash';

interface ChatHistoryProps {
  onHistoryItemClick: Dispatch<SetStateAction<boolean>>;
  startNewChat(): void;
}

export const ChatHistory = ({
  onHistoryItemClick,
  startNewChat,
}: ChatHistoryProps) => {
  const {
    loadConversation,
    messageHistoryStore,
    conversations,
    hasConversations,
  } = useAppContext();

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
      setOpenMenuId(null);
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

  // Single state for tracking which menu is open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className={styles.chatHistoryContainer}>
      <div data-testid="chat-history-section">
        {!hasConversations ? (
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
}

const HistoryItem = memo(
  ({
    conversation,
    handleChatHistoryClick,
    deleteConversation,
    isMenuOpen,
    onMenuClick,
  }: HistoryItemProps) => {
    const { id, title } = conversation;
    const { messageHistoryStore } = useAppContext();
    const isSelected = messageHistoryStore.getConversationID() === id;
    const [editingTitle, setEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(title);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const titleRef = useRef(title);

    // Memoize the save function that occurs
    const debouncedSave = useMemo(
      () =>
        _.debounce((id: string, newValue: string) => {
          try {
            const conversations = JSON.parse(
              localStorage.getItem('conversations') ?? '{}',
            );
            conversations[id].title = newValue;
            localStorage.setItem(
              'conversations',
              JSON.stringify(conversations),
            );
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }
        }, 100),
      [], // Empty deps since we want this to be created only once
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        debouncedSave.cancel();
      };
    }, [debouncedSave]);

    const handleSaveTitle = useCallback(() => {
      const trimmedTitle = newTitle.trim();
      if (trimmedTitle === '') {
        setNewTitle(titleRef.current);
        setEditingTitle(false);
        return;
      }

      //  update the UI immediately
      setNewTitle(trimmedTitle);
      setEditingTitle(false);
      titleRef.current = trimmedTitle;

      //  so we aren't blocked by the storage updatex
      debouncedSave(id, trimmedTitle);
    }, [newTitle, id, debouncedSave]);

    const handleMenuClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (editingTitle) {
        setEditingTitle(false);
        setNewTitle(titleRef.current);
      }
      onMenuClick();
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingTitle) {
        setNewTitle(titleRef.current);
        setEditingTitle(false);
      } else {
        setEditingTitle(true);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        handleSaveTitle();
      } else if (e.key === 'Escape') {
        setNewTitle(titleRef.current);
        setEditingTitle(false);
      }
    };

    useEffect(() => {
      if (editingTitle) {
        const input = inputRef.current;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }, [editingTitle]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
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
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.chatHistoryTitleInput}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            ) : (
              <small data-testid="chat-history-entry">{newTitle}</small>
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
          <button className={styles.menuButton} onClick={handleEdit}>
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
            onClick={(e) => {
              e.stopPropagation();
              deleteConversation(id);
            }}
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
