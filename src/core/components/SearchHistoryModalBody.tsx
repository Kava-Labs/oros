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
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { X as CloseX } from 'lucide-react';
import ButtonIcon from './ButtonIcon';

interface SearchModalBodyProps {
  conversations: ConversationHistory[];
  onConversationSelect: (conversation: ConversationHistory) => void;
  setIsOpen: (isOpen: boolean) => void;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  onClose: () => void;
}

const SearchHistoryModalBody = ({
  conversations,
  onConversationSelect,
  setIsOpen,
  searchTerm,
  setSearchTerm,
}: SearchModalBodyProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { conversationID } = useAppContext();

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

  const closeModalAndResetInput = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleConversationClick = (conversation: ConversationHistory) => {
    onConversationSelect(conversation);
    closeModalAndResetInput();
  };

  const isMobile = useIsMobile();

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
        {/*Mobile design uses the close icon within ModalWrapper*/}
        {!isMobile && (
          <ButtonIcon
            className={styles.searchCloseIcon}
            icon={CloseX}
            aria-label="Close search modal"
            onClick={closeModalAndResetInput}
          />
        )}
      </div>

      <div className={styles.results}>
        {Object.keys(groupedConversations).length === 0 ? (
          <div className={styles.noResults}>No results</div>
        ) : (
          Object.entries(groupedConversations).map(
            ([timeGroup, conversations]) => (
              <div key={timeGroup} className={styles.timeGroup}>
                <small className={styles.timeGroupTitle}>{timeGroup}</small>
                {conversations.map((conversation) => (
                  <div
                    data-testid="search-chat-history-entry"
                    key={conversation.id}
                    className={`${styles.conversationItem} ${conversationID === conversation.id ? styles.selected : ''}`}
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

export default SearchHistoryModalBody;
