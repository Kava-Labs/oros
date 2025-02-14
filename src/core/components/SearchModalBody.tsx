import styles from './SearchChatHistory.module.css';
import {
  formatContentSnippet,
  formatConversationTitle,
  groupAndFilterConversations,
  highlightMatch,
} from '../utils/conversation/helpers';
import React, { useRef } from 'react';
import { ConversationHistory } from '../context/types';
import { useAppContext } from '../context/useAppContext';

interface SearchModalBodyProps {
  conversations: ConversationHistory[];
  onConversationSelect: (conversation: ConversationHistory) => void;
  setIsOpen: (isOpen: boolean) => void;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  onClose: () => void;
}

const SearchModalBody = ({
  conversations,
  onConversationSelect,
  setIsOpen,
  searchTerm,
  setSearchTerm,
}: SearchModalBodyProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { messageHistoryStore } = useAppContext();

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
    <>
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
                    data-testid="search-chat-history-entry"
                    key={conversation.id}
                    className={`${styles.conversationItem} ${messageHistoryStore.getConversationID() === conversation.id ? styles.selected : ''}`}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <p
                      data-testid="search-history-title"
                      className={styles.conversationTitle}
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(
                          formatConversationTitle(conversation.title, 50),
                          searchTerm,
                        ),
                      }}
                    />
                    <p
                      data-testid="search-history-content"
                      className={styles.conversationSnippet}
                      dangerouslySetInnerHTML={{
                        __html: highlightMatch(
                          formatContentSnippet(conversation, searchTerm),
                          searchTerm,
                        ),
                      }}
                    />
                  </div>
                ))}
              </div>
            ),
          )
        )}
      </div>
    </>
  );
};

export default SearchModalBody;
