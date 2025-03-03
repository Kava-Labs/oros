import { SearchHistoryButton } from '../assets/SearchHistoryButton';
import ButtonIcon from './ButtonIcon';
import { PanelLeftClose } from 'lucide-react';

interface MobileSideBarProps {
  isSearchHistoryOpen: boolean;
  setIsSearchHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
  setIsDesktopSideBarHidden: (i: boolean) => void;
}

export const DesktopSideBar = ({
  isSearchHistoryOpen,
  setIsSearchHistoryOpen,
  setIsMobileSideBarOpen,
  setIsDesktopSideBarHidden,
}: MobileSideBarProps) => {
  return (
    <>
      <SearchHistoryButton
        isSearchHistoryOpen={isSearchHistoryOpen}
        setIsSearchHistoryOpen={setIsSearchHistoryOpen}
        setIsMobileSideBarOpen={setIsMobileSideBarOpen}
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
