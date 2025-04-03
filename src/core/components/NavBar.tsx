import styles from './NavBar.module.css';
import { useIsMobileLayout } from '../../shared/theme/useIsMobileLayout';
import { Menu, PanelLeftOpen } from 'lucide-react';
import ButtonIcon from './ButtonIcon';
import { NewChatButton } from '../assets/NewChatButton';
import { ModelSelector } from './ModelSelector';

export interface NavBarProps {
  onMenu: () => void;
  onPanelOpen: () => void;
  isPanelOpen: boolean;
  showModelSelector: boolean;
  startNewChat: () => void;
}

export const NavBar = ({
  onMenu,
  onPanelOpen,
  isPanelOpen,
  showModelSelector,
  startNewChat,
}: NavBarProps) => {
  const isMobileLayout = useIsMobileLayout();

  return (
    <div className={styles.nav}>
      <div className={styles.leftSection}>
        {!isMobileLayout ? (
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
            <NewChatButton
              onClick={startNewChat}
              className={styles.newChatDesktop}
            />
            {showModelSelector && <ModelSelector />}
          </div>
        ) : (
          <div className={styles.menu}>
            <ButtonIcon
              icon={Menu}
              tooltip={{
                text: 'Menu',
                position: 'bottom',
              }}
              aria-label="Toggle Menu"
              onClick={onMenu}
            />
          </div>
        )}
      </div>

      <div className={styles.centerSection}>
        {isMobileLayout && showModelSelector && <ModelSelector />}
      </div>

      <div className={styles.rightSection}>
        {isMobileLayout && <NewChatButton onClick={startNewChat} />}
      </div>
    </div>
  );
};
