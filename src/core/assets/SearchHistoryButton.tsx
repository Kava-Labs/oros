import { TextSearch } from 'lucide-react';
import ButtonIcon from '../components/ButtonIcon';
import type { ButtonIconProps } from '../components/ButtonIcon';
import SearchHistoryModal from '../components/SearchHistoryModal';
import { useAppContext } from '../context/useAppContext';
import { ConversationHistory } from '../context/types';

// Only need to specify props specific to SearchChatButton
// Omit the required props from ButtonIcon that we're providing
type SearchHistoryButtonProps = Omit<ButtonIconProps, 'icon' | 'aria-label'> & {
  isSearchHistoryOpen: boolean;
  setIsSearchHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
  loadConversation: (conversationHistory: ConversationHistory) => void;
};
export const SearchHistoryButton = ({
  isSearchHistoryOpen,
  setIsSearchHistoryOpen,
  setIsMobileSideBarOpen,
  className,
  loadConversation,
  ...buttonProps
}: SearchHistoryButtonProps) => {
  const { hasConversations } = useAppContext();
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
        />
      )}
    </>
  );
};
