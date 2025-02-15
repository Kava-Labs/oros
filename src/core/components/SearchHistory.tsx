import { useState, useRef, useEffect } from 'react';
import styles from './SearchChatHistory.module.css';
import ModalWrapper from './ModalWrapper';
import SearchHistoryModalBody from './SearchHistoryModalBody';
import { useAppContext } from '../context/useAppContext';
import { SearchHistoryButton } from '../assets/SearchHistoryButton';
import { ConversationHistory } from '../context/types';

interface SearchHistoryProps {
  isSearchHistoryOpen: boolean;
  setIsSearchHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
}

const SearchHistory = ({
  isSearchHistoryOpen,
  setIsSearchHistoryOpen,
  setIsMobileSideBarOpen,
}: SearchHistoryProps) => {
  const { conversations, hasConversations, loadConversation } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchHistoryOpen) {
      // Focus input when modal opens
      inputRef.current?.focus();
      //  mobile sidebar is closed by default and that contains the component that mounts the search modal,
      //  but if a user has opened chat history search from a larger screen, then we should update that so search modal
      //  stays open on screen resize
      // setIsMobileSideBarOpen(true);
    }
  }, [isSearchHistoryOpen, setIsMobileSideBarOpen]);

  const handleClose = () => {
    setIsSearchHistoryOpen(false);
    setSearchTerm('');
  };

  const onConversationSelect = (conversationHistory: ConversationHistory) => {
    loadConversation(conversationHistory);
    setIsSearchHistoryOpen(false);
    //  on mobile we want to get the user back to the chat view after selection
    setIsMobileSideBarOpen(false);
  };

  return (
    <div className={styles.container}>
      <SearchHistoryButton
        onClick={() => setIsSearchHistoryOpen(true)}
        disabled={!hasConversations}
      />

      {isSearchHistoryOpen && (
        <ModalWrapper modalRef={modalRef} onClose={handleClose}>
          <SearchHistoryModalBody
            conversations={conversations}
            onConversationSelect={onConversationSelect}
            setIsOpen={setIsSearchHistoryOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onClose={handleClose}
          />
        </ModalWrapper>
      )}
    </div>
  );
};

export default SearchHistory;
