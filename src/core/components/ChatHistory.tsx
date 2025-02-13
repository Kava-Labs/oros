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
import { EllipsisVertical, Pencil, Trash2, X } from 'lucide-react';
import {
  // formatConversationTitle,
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { loadConversation, messageHistoryStore } = useAppContext();

  useEffect(() => {
    const load = () => {
      const storedConversations = Object.values(
        JSON.parse(localStorage.getItem('conversations') ?? '{}'),
      ) as ConversationHistory[];
      setConversations(storedConversations);
    };
    load();
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

  const handleMenuToggle = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className={styles.chatHistoryContainer}>
      <div data-testid="chat-history-section">
        {Object.entries(groupedHistories).map(([timeGroup, conversations]) => (
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
                  onMenuToggle={handleMenuToggle}
                  onMenuClose={() => setOpenMenuId(null)}
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
  isMenuOpen: boolean;
  onMenuToggle: (id: string) => void;
  onMenuClose: () => void;
}

const HistoryItem = memo(
  ({
    conversation,
    handleChatHistoryClick,
    deleteConversation,
    isMenuOpen,
    onMenuToggle,
    onMenuClose,
  }: HistoryItemProps) => {
    const { id, title } = conversation;
    const [editingTitle, setEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(title);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { messageHistoryStore } = useAppContext();
    const isSelected = messageHistoryStore.getConversationID() === id;
    const hasEdits = newTitle !== title;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const isClickInsideMenu = menuRef.current?.contains(target);
        const isClickInsideInput = inputRef.current?.contains(target);
        const isClickOnButton = (target as HTMLElement).closest('button');

        if (isClickInsideMenu || isClickInsideInput || isClickOnButton) {
          return;
        }

        if (editingTitle && hasEdits) {
          handleSaveTitle();
        } else if (editingTitle) {
          setEditingTitle(false);
          setNewTitle(title);
        }

        onMenuClose();
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [editingTitle, hasEdits]);

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

    const handleSaveTitle = () => {
      const trimmedTitle = newTitle.trim();
      if (trimmedTitle === '') {
        setNewTitle(title);
      } else if (trimmedTitle !== title) {
        saveToLocalStorage(trimmedTitle);
      }
      setEditingTitle(false);
    };

    useEffect(() => {
      let tid: NodeJS.Timeout;
      if (newTitle !== title && editingTitle) {
        // Save to localStorage while typing
        saveToLocalStorage(newTitle);

        // Set a timeout to exit edit mode
        tid = setTimeout(() => {
          setEditingTitle(false);
        }, 1000);
      } else if (editingTitle) {
        // If no changes made, exit edit mode after longer delay
        tid = setTimeout(() => {
          setEditingTitle(false);
        }, 5000);
      }

      return () => {
        if (tid) {
          clearTimeout(tid);
        }
      };
    }, [newTitle, title, editingTitle, saveToLocalStorage]);

    useEffect(() => {
      if (editingTitle) {
        // Focus and select all text when edit mode is entered
        const input = inputRef.current;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }, [editingTitle]);

    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingTitle && hasEdits) {
        handleSaveTitle();
      }
      onMenuToggle(id);
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingTitle) {
        setNewTitle(title);
        setEditingTitle(false);
      } else {
        setEditingTitle(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteConversation(id);
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

    return (
      <div
        className={`${styles.chatHistoryItem} ${isSelected ? styles.selected : ''} ${isMenuOpen ? styles.expanded : ''}`}
      >
        <div
          className={styles.chatHistoryContent}
          onClick={() => !editingTitle && handleChatHistoryClick(conversation)}
        >
          {!editingTitle ? (
            <small className={styles.chatHistoryTitle}>{newTitle}</small>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              className={styles.chatHistoryTitleInput}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div ref={menuRef}>
            <ButtonIcon
              className={styles.menuIcon}
              icon={EllipsisVertical}
              size={20}
              tooltip={{
                text: 'Chat Options',
                position: 'bottom',
              }}
              aria-label="ChatOptions"
              onClick={handleMenuClick}
            />
          </div>
        </div>

        {isMenuOpen && (
          <div className={styles.menuWrapper}>
            <div className={styles.dropdownMenu}>
              <button className={styles.menuItem} onClick={handleEdit}>
                {editingTitle ? (
                  <>
                    <X size={16} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Pencil size={16} />
                    Rename
                  </>
                )}
              </button>
              <button
                className={styles.menuItem}
                data-delete="true"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default ChatHistory;
