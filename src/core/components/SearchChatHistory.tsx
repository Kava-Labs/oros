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
      inputRef.current?.focus();
    }
  }, [isChatHistoryOpen]);

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

      <ModalWrapper
        modalRef={modalRef}
        onClose={handleClose}
        isOpen={isChatHistoryOpen}
      >
        <SearchModalBody
          conversations={conversations}
          onConversationSelect={onConversationSelect}
          setIsOpen={setIsChatHistoryOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onClose={handleClose}
        />
      </ModalWrapper>
    </div>
  );
};

export default SearchChatHistory;
