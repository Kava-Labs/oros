import { useState } from 'react';
import { ChatView } from './core/components/ChatView';
import { useAppContext } from './core/context/useAppContext';
import styles from './App.module.css';
import { ChatHistory } from './core/components/ChatHistory';
import { useIsMobileLayout } from 'lib-kava-ai';
import KavaAILogo from './core/assets/KavaAILogo';
import { DesktopSideBar } from './core/components/DesktopSideBar';
import { MobileSideBar } from './core/components/MobileSideBar';
import { MobileBackdrop } from './core/components/MobileBackdrop';

export const App = () => {
  const {
    isReady,
    modelConfig,
    startNewChat,
    loadConversation,
    conversationID,
    conversations,
  } = useAppContext();
  const { supportedFileTypes } = modelConfig;
  const isMobileLayout = useIsMobileLayout();

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
                {isMobileLayout && isMobileSideBarOpen && (
                  <MobileSideBar
                    isSearchHistoryOpen={isSearchHistoryOpen}
                    setIsSearchHistoryOpen={setIsSearchHistoryOpen}
                    setIsMobileSideBarOpen={setIsMobileSideBarOpen}
                    loadConversation={loadConversation}
                    conversations={conversations}
                  />
                )}
                {!isMobileLayout && !isDesktopSideBarHidden && (
                  <DesktopSideBar
                    isSearchHistoryOpen={isSearchHistoryOpen}
                    setIsSearchHistoryOpen={setIsSearchHistoryOpen}
                    setIsMobileSideBarOpen={setIsMobileSideBarOpen}
                    setIsDesktopSideBarHidden={setIsDesktopSideBarHidden}
                    loadConversation={loadConversation}
                    conversations={conversations}
                  />
                )}
              </div>
            </div>

            <div className={styles.sidebarContent}>
              <ChatHistory
                conversationID={conversationID}
                onHistoryItemClick={setIsMobileSideBarOpen}
                startNewChat={startNewChat}
                loadConversation={loadConversation}
                conversations={conversations}
              />
            </div>
          </div>

          <div className={styles.content}>
            <ChatView
              onMenu={() => setIsMobileSideBarOpen(true)}
              onPanelOpen={() => setIsDesktopSideBarHidden(false)}
              isPanelOpen={!isDesktopSideBarHidden}
              supportsUpload={supportedFileTypes.length > 0}
              showModelSelector={true}
              startNewChat={startNewChat}
              conversationID={conversationID}
              modelConfig={modelConfig}
            />
          </div>
        </div>
      )}
    </>
  );
};
