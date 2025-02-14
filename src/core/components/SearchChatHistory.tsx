import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import styles from './SearchChatHistory.module.css';
import { ConversationHistory } from '../context/types';
import ModalWrapper from './ModalWrapper';
import SearchModalBody from './SearchModalBody';

interface SearchModalProps {
  conversations: ConversationHistory[];
  onConversationSelect: (conversation: ConversationHistory) => void;
}

const SearchChatHistory = ({
  conversations,
  onConversationSelect,
}: SearchModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={styles.container}>
      <button
        data-testid="search-conversation-button"
        className={styles.iconButton}
        onClick={() => setIsOpen(true)}
        aria-label="Search conversations"
      >
        <Search size={20} />
      </button>

      {isOpen && (
        <ModalWrapper
          modalRef={modalRef}
          onCloseClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        >
          <SearchModalBody
            conversations={conversations}
            onConversationSelect={onConversationSelect}
            setIsOpen={setIsOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </ModalWrapper>
      )}
    </div>
  );
};

export default SearchChatHistory;
