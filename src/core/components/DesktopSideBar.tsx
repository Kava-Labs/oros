import { SearchHistoryButton } from '../assets/SearchHistoryButton';
import ButtonIcon from './ButtonIcon';
import { PanelLeftClose } from 'lucide-react';
import { ConversationHistory } from '../context/types';

interface MobileSideBarProps {
  isSearchHistoryOpen: boolean;
  setIsSearchHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
  setIsDesktopSideBarHidden: (i: boolean) => void;
  loadConversation: (conversation: ConversationHistory) => void;
  conversations: ConversationHistory[];
}

export const DesktopSideBar = ({
  isSearchHistoryOpen,
  setIsSearchHistoryOpen,
  setIsMobileSideBarOpen,
  setIsDesktopSideBarHidden,
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
        icon={PanelLeftClose}
        tooltip={{
          text: 'Close Menu',
          position: 'bottom',
        }}
        aria-label="Close Menu"
        onClick={() => setIsDesktopSideBarHidden(true)}
      />
    </>
  );
};
