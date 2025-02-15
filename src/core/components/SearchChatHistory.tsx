import { useState, useRef, useEffect } from 'react';
import styles from './SearchChatHistory.module.css';
import ModalWrapper from './ModalWrapper';
import SearchModalBody from './SearchModalBody';
import { useAppContext } from '../context/useAppContext';
import { SearchChatButton } from '../assets/SearchChatButton';
import { ConversationHistory } from '../context/types';

interface SearchModalProps {
  isChatHistoryOpen: boolean;
  setIsChatHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
}

const SearchChatHistory = ({
  isChatHistoryOpen,
  setIsChatHistoryOpen,
  setIsMobileSideBarOpen,
}: SearchModalProps) => {
  const { conversations, hasConversations, loadConversation } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatHistoryOpen) {
      // Focus input when modal opens
      inputRef.current?.focus();
      //  mobile sidebar is closed by default and that contains the component that mounts the search modal,
      //  but if a user has opened chat history search from a larger screen, then we should update that so search modal
      //  stays open on screen resize
      setIsMobileSideBarOpen(true);
    }
  }, [isChatHistoryOpen, setIsMobileSideBarOpen]);

  useEffect(() => {
    if (isChatHistoryOpen) {
    }
  });

  const handleClose = () => {
    setIsChatHistoryOpen(false);
    setSearchTerm('');
  };

  const onConversationSelect = (conversationHistory: ConversationHistory) => {
    loadConversation(conversationHistory);
    setIsChatHistoryOpen(false);
    //  on mobile we want to get the user back to the chat view after selection
    setIsMobileSideBarOpen(false);
  };

  return (
    <div className={styles.container}>
      <SearchChatButton
        onClick={() => setIsChatHistoryOpen(true)}
        disabled={!hasConversations}
      />

      {isChatHistoryOpen && (
        <ModalWrapper modalRef={modalRef} onClose={handleClose}>
          <SearchModalBody
            conversations={conversations}
            onConversationSelect={onConversationSelect}
            setIsOpen={setIsChatHistoryOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onClose={handleClose}
          />
        </ModalWrapper>
      )}
    </div>
  );
};

export default SearchChatHistory;
