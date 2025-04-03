import { TextSearch } from 'lucide-react';
import ButtonIcon from '../components/ButtonIcon';
import type { ButtonIconProps } from '../components/ButtonIcon';
import SearchHistoryModal from '../components/SearchHistoryModal';
import { ConversationHistory } from '../context/types';

// Only need to specify props specific to SearchChatButton
// Omit the required props from ButtonIcon that we're providing
type SearchHistoryButtonProps = Omit<ButtonIconProps, 'icon' | 'aria-label'> & {
  isSearchHistoryOpen: boolean;
  setIsSearchHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
  loadConversation: (conversationHistory: ConversationHistory) => void;
  conversations: ConversationHistory[];
};
export const SearchHistoryButton = ({
  isSearchHistoryOpen,
  setIsSearchHistoryOpen,
  setIsMobileSideBarOpen,
  className,
  loadConversation,
  conversations,
  ...buttonProps
}: SearchHistoryButtonProps) => {
  const hasConversations = conversations.length > 0;
  const onSearchHistoryButtonClick = () => {
    setIsSearchHistoryOpen(true);
  };

  return (
    <>
      <ButtonIcon
        disabled={!hasConversations}
        onClick={onSearchHistoryButtonClick}
        icon={TextSearch}
        className={className || ''}
        tooltip={{
          text: 'Search History',
          position: 'bottom',
        }}
        aria-label="Search History"
        {...buttonProps}
      />
      {isSearchHistoryOpen && (
        <SearchHistoryModal
          isSearchHistoryOpen={isSearchHistoryOpen}
          setIsSearchHistoryOpen={setIsSearchHistoryOpen}
          setIsMobileSideBarOpen={setIsMobileSideBarOpen}
          loadConversation={loadConversation}
          conversations={conversations}
        />
      )}
    </>
  );
};
