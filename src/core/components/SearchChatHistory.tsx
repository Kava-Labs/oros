import { useState, useRef, useEffect } from 'react';
import styles from './SearchChatHistory.module.css';
import ModalWrapper from './ModalWrapper';
import SearchModalBody from './SearchModalBody';
import { useAppContext } from '../context/useAppContext';
import { SearchChatButton } from '../assets/SearchChatButton';
import { ConversationHistory } from '../context/types';

interface SearchModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SearchChatHistory = ({ isOpen, setIsOpen }: SearchModalProps) => {
  const { conversations, hasConversations, loadConversation } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  const onConversationSelect = (conversationHistory: ConversationHistory) => {
    loadConversation(conversationHistory);
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <SearchChatButton
        onClick={() => setIsOpen(true)}
        disabled={!hasConversations}
      />

      <ModalWrapper modalRef={modalRef} onClose={handleClose} isOpen={isOpen}>
        <SearchModalBody
          conversations={conversations}
          onConversationSelect={onConversationSelect}
          setIsOpen={setIsOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onClose={handleClose}
        />
      </ModalWrapper>
    </div>
  );
};

export default SearchChatHistory;
