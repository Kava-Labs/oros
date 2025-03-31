import styles from './NavBar.module.css';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { Menu, PanelLeftOpen } from 'lucide-react';
import ButtonIcon from './ButtonIcon';
import { NewChatButton } from '../assets/NewChatButton';
import { ModelSelector } from './ModelSelector';
import { useAppContext } from '../context/useAppContext';

interface NavBarProps {
  onMenu(): void;
  onPanelOpen(): void;
  isPanelOpen: boolean;
}

export const NavBar = ({ onMenu, onPanelOpen, isPanelOpen }: NavBarProps) => {
  const isMobile = useIsMobile();

  const { startNewChat, modelConfig } = useAppContext();

  console.log('model name', modelConfig.id);
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
            <ModelSelector />
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
        {isMobile && <ModelSelector />}
      </div>

      <div className={styles.rightSection}>
        {isMobile && <NewChatButton onClick={startNewChat} />}
      </div>
    </div>
  );
};
