import { useState } from 'react';
import { ChatView } from './core/components/ChatView';
import { defaultCautionText } from './features/blockchain/config/prompts/defaultPrompts';
import { useAppContext } from './core/context/useAppContext';
import styles from './App.module.css';
import { ChatHistory } from './core/components/ChatHistory';
import { useIsMobile } from './shared/theme/useIsMobile';
import { X as CloseX, PanelLeftClose } from 'lucide-react';
import KavaAILogo from './core/assets/KavaAILogo';
import ButtonIcon from './core/components/ButtonIcon';
import { useMessageHistory } from './core/hooks/useMessageHistory';
import { SearchHistoryButton } from './core/assets/SearchHistoryButton';

export const App = () => {
  const { isReady, modelConfig, hasConversations } = useAppContext();
  const { messages } = useMessageHistory();

  const isMobile = useIsMobile();

  /*
   * Supports separate memorization of sidebar & history search states between mobile and desktop
   */
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  // TODO: Support a collapse sidebar button
  const [isDesktopSideBarHidden, setIsDesktopSideBarHidden] = useState(false);

  return (
    <>
      {isReady && (
        <div className={styles.app}>
          <div
            className={`${styles.backdrop} ${isMobileSideBarOpen ? styles.isOpen : ''}`}
            onClick={() => setIsMobileSideBarOpen(false)}
          ></div>

          <div
            className={`${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarHidden ? styles.isHidden : ''}`}
          >
            <div className={styles.sidebarHeader}>
              <KavaAILogo height={20} />
              {isMobile && isMobileSideBarOpen && (
                <div className={styles.buttonGroup}>
                  <SearchHistoryButton
                    disabled={!hasConversations}
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
              )}
              {!isMobile && !isDesktopSideBarHidden && (
                <div className={styles.buttonGroup}>
                  <SearchHistoryButton
                    disabled={!hasConversations}
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
                </div>
              )}
            </div>

            <div className={styles.sidebarContent}>
              <ChatHistory onHistoryItemClick={setIsMobileSideBarOpen} />
            </div>
          </div>

          <div className={styles.content}>
            <ChatView
              introText={modelConfig.introText}
              cautionText={defaultCautionText}
              messages={messages}
              onMenu={() => setIsMobileSideBarOpen(true)}
              onPanelOpen={() => setIsDesktopSideBarHidden(false)}
              isPanelOpen={!isDesktopSideBarHidden}
            />
          </div>
        </div>
      )}
    </>
  );
};
