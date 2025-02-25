import { useState } from 'react';
import { ChatView } from './core/components/ChatView';
import { useAppContext } from './core/context/useAppContext';
import styles from './App.module.css';
import { ChatHistory } from './core/components/ChatHistory';
import { useIsMobile } from './shared/theme/useIsMobile';
import KavaAILogo from './core/assets/KavaAILogo';
import { DesktopSideBar } from './core/components/DesktopSideBar';
import { MobileSideBar } from './core/components/MobileSideBar';
import { MobileBackdrop } from './core/components/MobileBackdrop';

export const App = () => {
<<<<<<< HEAD
  const { isReady } = useAppContext();
=======
  const { isReady, modelConfig, hasConversations } = useAppContext();
  const { messages } = useMessageHistory();

>>>>>>> 8397b99 (feat: remove unneccesarry prop drilling for handlers that live in context)
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
          <MobileBackdrop
            styles={`${styles.backdrop} ${isMobileSideBarOpen ? styles.isOpen : ''}`}
            onBackdropClick={() => setIsMobileSideBarOpen(false)}
          />

          <div
            className={`${styles.sidebar} ${isMobileSideBarOpen ? styles.isOpen : ''} ${isDesktopSideBarHidden ? styles.isHidden : ''}`}
          >
            <div className={styles.sidebarHeader}>
              <KavaAILogo height={20} />
              <div className={styles.buttonGroup}>
                {isMobile && isMobileSideBarOpen && (
                  <MobileSideBar
                    isSearchHistoryOpen={isSearchHistoryOpen}
                    setIsSearchHistoryOpen={setIsSearchHistoryOpen}
                    setIsMobileSideBarOpen={setIsMobileSideBarOpen}
                  />
                )}
                {!isMobile && !isDesktopSideBarHidden && (
                  <DesktopSideBar
                    isSearchHistoryOpen={isSearchHistoryOpen}
                    setIsSearchHistoryOpen={setIsSearchHistoryOpen}
                    setIsMobileSideBarOpen={setIsMobileSideBarOpen}
                    setIsDesktopSideBarHidden={setIsDesktopSideBarHidden}
                  />
                )}
              </div>
            </div>

            <div className={styles.sidebarContent}>
              <ChatHistory onHistoryItemClick={setIsMobileSideBarOpen} />
            </div>
          </div>

          <div className={styles.content}>
            <ChatView
<<<<<<< HEAD
=======
              introText={modelConfig.introText}
              cautionText={defaultCautionText}
              messages={messages}
>>>>>>> 8397b99 (feat: remove unneccesarry prop drilling for handlers that live in context)
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
