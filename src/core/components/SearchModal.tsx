import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchModal.module.css';
import { ConversationHistory } from '../context/types';
import { useAppContext } from '../context/useAppContext';
import {
  formatConversationTitle,
  groupAndFilterConversations,
} from '../utils/conversation/helpers';

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

  const groupedConversations = groupAndFilterConversations(
    conversations,
    searchTerm,
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
            <button
              onClick={() => {
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={`${styles.iconButton} ${styles.closeButton}`}
              aria-label="Close search"
            >
              <X size={20} />
            </button>
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
                            {formatConversationTitle(conversation.title, 50)}
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
