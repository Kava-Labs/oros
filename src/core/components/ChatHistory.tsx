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
import KavaAILogo from '../assets/KavaAILogo';
import { Pencil } from 'lucide-react';
import { PenSquare } from 'lucide-react';
import SearchChatHistory from './SearchChatHistory';
import {
  formatConversationTitle,
  groupConversationsByTime,
} from '../utils/conversation/helpers';

interface ChatHistoryProps {
  setChatHistoryOpen: Dispatch<SetStateAction<boolean>>;
}

export const ChatHistory = ({ setChatHistoryOpen }: ChatHistoryProps) => {
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const {
    loadConversation,
    messageHistoryStore,
    modelConfig,
    thinkingStore,
    setIsRequesting,
  } = useAppContext();
  const isMobile = useIsMobile();

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

  const startNewChat = useCallback(() => {
    thinkingStore.setText('');
    messageHistoryStore.reset();
    messageHistoryStore.addMessage({
      role: 'system' as const,
      content: modelConfig.systemPrompt,
    });
    setIsRequesting(false);
  }, [
    messageHistoryStore,
    modelConfig.systemPrompt,
    setIsRequesting,
    thinkingStore,
  ]);

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
      <div className={styles.searchControls}>
        <SearchChatHistory
          conversations={conversations}
          onConversationSelect={handleChatHistoryClick}
        />
        {!isMobile && (
          <div
            onClick={startNewChat}
            data-testid="new-chat-button"
            className={styles.newChatButtonAlignment}
          >
            <PenSquare
              size={20}
              className={styles.newChatButtonAlignment}
              onClick={startNewChat}
            />
          </div>
        )}
      </div>
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
              <Pencil
                className={styles.editIcon}
                data-testid="edit-chat-history-entry-icon"
                width="19px"
                height="19px"
                onClick={() => setEditingTitle(true)}
              />
              <div className={styles.deleteIcon} />
              <TrashIcon
                data-testid="delete-chat-history-entry-icon"
                width="19px"
                height="19px"
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
