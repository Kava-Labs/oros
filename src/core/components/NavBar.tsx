import styles from './NavBar.module.css';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { Menu, PanelLeftOpen } from 'lucide-react';
import ButtonIcon from './ButtonIcon';
import { NewChatButton } from '../assets/NewChatButton';
import { ModelSelector } from './ModelSelector';
import { useAppContext } from '../context/useAppContext';

export interface NavBarProps {
  onMenu(): void;
  onPanelOpen(): void;
  isPanelOpen: boolean;
  showModelSelector: boolean;
}

export const NavBar = ({
  onMenu,
  onPanelOpen,
  isPanelOpen,
  showModelSelector,
}: NavBarProps) => {
  const isMobile = useIsMobile();

  const { startNewChat } = useAppContext();

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
        {isMobile && showModelSelector && <ModelSelector />}
      </div>

      <div className={styles.rightSection}>
        {isMobile && <NewChatButton onClick={startNewChat} />}
      </div>
    </div>
  );
};
