import { SearchHistoryButton } from '../assets/SearchHistoryButton';
import ButtonIcon from './ButtonIcon';
import { X as CloseX } from 'lucide-react';
import { ConversationHistory } from '../context/types';

interface MobileSideBarProps {
  isSearchHistoryOpen: boolean;
  setIsSearchHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
  loadConversation: (conversationHistory: ConversationHistory) => void;
  conversations: ConversationHistory[];
}

export const MobileSideBar = ({
  isSearchHistoryOpen,
  setIsSearchHistoryOpen,
  setIsMobileSideBarOpen,
  loadConversation,
  conversations,
}: MobileSideBarProps) => {
  return (
    <>
      <SearchHistoryButton
        isSearchHistoryOpen={isSearchHistoryOpen}
        setIsSearchHistoryOpen={setIsSearchHistoryOpen}
        setIsMobileSideBarOpen={setIsMobileSideBarOpen}
        loadConversation={loadConversation}
        conversations={conversations}
      />
      <ButtonIcon
        icon={CloseX}
        tooltip={{
          text: 'Close Menu',
          position: 'bottom',
        }}
        aria-label="Close Menu"
        onClick={() => setIsMobileSideBarOpen(false)}
      />
    </>
  );
};
