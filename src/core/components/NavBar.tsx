import styles from './NavBar.module.css';
import { useIsMobileLayout } from 'lib-kava-ai';
import { Menu, PanelLeftOpen } from 'lucide-react';
import ButtonIcon from './ButtonIcon';
import { NewChatButton } from '../assets/NewChatButton';
import { ModelSelector } from './ModelSelector';
import type { SupportedModels, ModelConfig } from '../types/models';

export interface NavBarProps {
  onMenu: () => void;
  onPanelOpen: () => void;
  isPanelOpen: boolean;
  showModelSelector: boolean;
  startNewChat: () => void;
  handleModelChange: (modelName: SupportedModels) => void;
  modelConfig: ModelConfig;
  isModelSelectorDisabled: boolean;
}

export const NavBar = ({
  onMenu,
  onPanelOpen,
  isPanelOpen,
  showModelSelector,
  startNewChat,
  handleModelChange,
  modelConfig,
  isModelSelectorDisabled,
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
            {showModelSelector && (
              <ModelSelector
                handleModelChange={handleModelChange}
                modelConfig={modelConfig}
                isModelSelectorDisabled={isModelSelectorDisabled}
              />
            )}
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
        {isMobileLayout && showModelSelector && (
          <ModelSelector
            handleModelChange={handleModelChange}
            modelConfig={modelConfig}
            isModelSelectorDisabled={isModelSelectorDisabled}
          />
        )}
      </div>

      <div className={styles.rightSection}>
        {isMobileLayout && <NewChatButton onClick={startNewChat} />}
      </div>
    </div>
  );
};
