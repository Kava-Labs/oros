import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchModal.module.css';
import { ConversationHistory } from '../context/types';
import { useAppContext } from '../context/useAppContext';
import { groupAndFilterConversations } from '../utils/conversation/helpers';

interface SearchModalProps {
  conversations: ConversationHistory[];
  onConversationSelect: (conversation: ConversationHistory) => void;
}

interface FilteredConversation extends ConversationHistory {
  displayedTitle: string;
  displayedPortion: string;
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
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Modify the grouping logic to handle empty search term
  const groupedConversations = searchTerm
    ? groupAndFilterConversations(conversations, searchTerm)
    : { Recent: conversations.sort((a, b) => b.lastSaved - a.lastSaved) };

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

  const getDisplayedPortion = (conversation: ConversationHistory) => {
    const messages =
      conversation.conversation[0]?.role === 'system'
        ? conversation.conversation.slice(1)
        : conversation.conversation;

    const firstUserMessage = messages.find((msg) => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.content) {
      const content = Array.isArray(firstUserMessage.content)
        ? firstUserMessage.content.map((part) => part).join('')
        : firstUserMessage.content;
      return content.slice(0, 100); // Show the first 100 characters
    }
    return '';
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
              {Object.entries(groupedConversations).length === 0 ? (
                // If no matches found, display "No results"
                <div className={styles.noResults}>No results</div>
              ) : (
                // Display grouped conversations
                Object.entries(groupedConversations).map(
                  ([timeGroup, convos]) => (
                    <div key={timeGroup} className={styles.timeGroup}>
                      <h6 className={styles.timeGroupTitle}>{timeGroup}</h6>
                      {convos.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`${styles.conversationItem} ${messageHistoryStore.getConversationID() === conversation.id ? styles.selected : ''}`}
                          onClick={() => handleConversationClick(conversation)}
                        >
                          <span className={styles.conversationTitle}>
                            {conversation.title}
                          </span>
                          <p className={styles.conversationSnippet}>
                            {searchTerm
                              ? (conversation as FilteredConversation)
                                  .displayedPortion ||
                                getDisplayedPortion(conversation)
                              : getDisplayedPortion(conversation)}
                          </p>
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
