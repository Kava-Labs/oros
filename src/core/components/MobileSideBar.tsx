import styles from '../../App.module.css';
import { SearchHistoryButton } from '../assets/SearchHistoryButton';
import ButtonIcon from './ButtonIcon';
import { X as CloseX } from 'lucide-react';

interface MobileSideBarProps {
  isSearchHistoryOpen: boolean;
  setIsSearchHistoryOpen: (i: boolean) => void;
  setIsMobileSideBarOpen: (i: boolean) => void;
}

export const MobileSideBar = ({
  isSearchHistoryOpen,
  setIsSearchHistoryOpen,
  setIsMobileSideBarOpen,
}: MobileSideBarProps) => {
  return (
    <div className={styles.buttonGroup}>
      <SearchHistoryButton
        isSearchHistoryOpen={isSearchHistoryOpen}
        setIsSearchHistoryOpen={setIsSearchHistoryOpen}
        setIsMobileSideBarOpen={setIsMobileSideBarOpen}
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
    </div>
  );
};
