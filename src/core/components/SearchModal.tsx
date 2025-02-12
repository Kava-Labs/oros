import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import styles from './SearchModal.module.css';
import { ConversationHistory } from '../context/types';
import { useAppContext } from '../context/useAppContext';

interface SearchModalProps {
  conversations: ConversationHistory[];
  onConversationSelect: (conversation: ConversationHistory) => void;
}

const SearchModal = ({
  conversations,
  onConversationSelect,
}: SearchModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messageHistoryStore } = useAppContext();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when modal opens
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getTimeGroup = (timestamp: number): string => {
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - timestamp) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return 'Last week';
    if (diffDays <= 14) return '2 weeks ago';
    if (diffDays <= 30) return 'Last month';
    return 'Older';
  };

  const groupedConversations = conversations
    .filter((conv) =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .reduce(
      (groups, conversation) => {
        const timeGroup = getTimeGroup(conversation.lastSaved);
        if (!groups[timeGroup]) {
          groups[timeGroup] = [];
        }
        groups[timeGroup].push(conversation);
        return groups;
      },
      {} as Record<string, ConversationHistory[]>,
    );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleConversationClick = (conversation: ConversationHistory) => {
    onConversationSelect(conversation);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.iconButton}
        onClick={() => setIsOpen(true)}
        aria-label="Search conversations"
      >
        <Search size={20} />
      </button>

      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} ref={modalRef}>
            <div className={styles.searchInputWrapper}>
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className={styles.results}>
              {Object.keys(groupedConversations).length === 0 ? (
                <div className={styles.noResults}>No results</div>
              ) : (
                Object.entries(groupedConversations).map(
                  ([timeGroup, conversations]) => (
                    <div key={timeGroup} className={styles.timeGroup}>
                      <h6 className={styles.timeGroupTitle}>{timeGroup}</h6>
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`${styles.conversationItem} ${
                            messageHistoryStore.getConversationID() ===
                            conversation.id
                              ? styles.selected
                              : ''
                          }`}
                          onClick={() => handleConversationClick(conversation)}
                        >
                          <span className={styles.conversationTitle}>
                            {conversation.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchModal;
