import styles from './NavBar.module.css';
import HamburgerIcon from '../assets/HamburgerIcon';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { PanelLeftOpen } from 'lucide-react';
import ButtonIcon from './ButtonIcon';
import { NewChatButton } from '../assets/NewChatButton';
import { ModelSelector } from './ModelSelector';

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

  return (
    <div className={styles.nav}>
      <div className={styles.leftSection}>
        {!isMobile ? (
          <div className={styles.desktopControls}>
            {!isPanelOpen && (
              <ButtonIcon
                icon={PanelLeftOpen}
                tooltip={{
                  text: 'Open Menu',
                  position: 'bottom',
                }}
                aria-label="Open Menu"
                onClick={onPanelOpen}
              />
            )}
            <NewChatButton onClick={onNewChat} />
            <ModelSelector />
          </div>
        ) : (
          <div className={styles.menu} onClick={onMenu}>
            <HamburgerIcon />
          </div>
        )}
      </div>

      <div className={styles.centerSection}>
        {isMobile && <ModelSelector />}
      </div>

      <div className={styles.rightSection}>
        {isMobile && <NewChatButton onClick={onNewChat} />}
      </div>
    </div>
  );
};
