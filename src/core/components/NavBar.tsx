import styles from './NavBar.module.css';
import HamburgerIcon from '../assets/HamburgerIcon';
import ModelSelector from './ModelSelector';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import NewChatIcon from '../assets/NewChatIcon';
import { PanelLeftOpen } from 'lucide-react';
import ButtonIcon from './ButtonIcon';

interface NavBarProps {
  onMenu(): void;
  onNewChat(): void;
  onPanelOpen(): void;
  isPanelOpen: boolean;
}

export const NavBar = ({
  onMenu,
  onNewChat,
  onPanelOpen,
  isPanelOpen,
}: NavBarProps) => {
  const isMobile = useIsMobile();
  const showPanelOpen = !isMobile && !isPanelOpen;

  return (
    <div className={`${styles.nav} ${showPanelOpen ? '' : ''}`}>
      <ButtonIcon
        icon={PanelLeftOpen}
        className={`${styles.panelOpen} ${showPanelOpen ? styles.showPanelOpen : ''}`}
        tooltip={{
          text: 'Open Menu',
          position: 'bottom',
        }}
        aria-label="Open Menu"
        onClick={onPanelOpen}
      />

      <div className={styles.menu} onClick={onMenu}>
        <HamburgerIcon />
      </div>

      <ModelSelector />

      <div className={styles.newChat} onClick={onNewChat}>
        <NewChatIcon />
      </div>
    </div>
  );
};

export default NavBar;
