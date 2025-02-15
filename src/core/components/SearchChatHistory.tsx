import { useState, useRef, useEffect } from 'react';
import styles from './SearchChatHistory.module.css';
import ModalWrapper from './ModalWrapper';
import SearchModalBody from './SearchModalBody';
import { useAppContext } from '../context/useAppContext';
import { SearchChatButton } from '../assets/SearchChatButton';

interface SearchModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // conversations: ConversationHistory[];
  // onConversationSelect: (conversation: ConversationHistory) => void;
}

const SearchChatHistory = ({
  isOpen,
  setIsOpen,
  // conversations,
  // onConversationSelect,
}: SearchModalProps) => {
  const { conversations, hasConversations, loadConversation } = useAppContext();
  // const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus input when modal opens
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={styles.container}>
      <SearchChatButton
        onClick={() => setIsOpen(true)}
        disabled={!hasConversations}
      />

      {isOpen && (
        <ModalWrapper modalRef={modalRef} onClose={handleClose}>
          <SearchModalBody
            conversations={conversations}
            onConversationSelect={loadConversation}
            setIsOpen={setIsOpen}
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
