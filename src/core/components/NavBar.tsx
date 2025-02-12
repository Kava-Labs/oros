import styles from './NavBar.module.css';
import KavaAILogo from '../assets/KavaAILogo';
import HamburgerIcon from '../assets/HamburgerIcon';
import { isInIframe } from '../utils/isInIframe';
import ModelSelector from './ModelSelector';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import NewChatIcon from '../assets/NewChatIcon';
import { useAppContext } from '../context/useAppContext';
import { PanelLeftOpen } from 'lucide-react';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

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
      <PanelLeftOpen
        className={`${styles.panelOpen} ${showPanelOpen ? styles.showPanelOpen : ''}`}
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
