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

export const App = () => {
  const {
    isReady,
    modelConfig,
    messageHistoryStore,
    thinkingStore,
    handleChatCompletion,
    setIsRequesting,
    handleCancel,
  } = useAppContext();
  const { messages } = useMessageHistory();

  const startNewChat = () => {
    handleCancel();
    thinkingStore.setText('');
    messageHistoryStore.reset();
    messageHistoryStore.addMessage({
      role: 'system' as const,
      content: modelConfig.systemPrompt,
    });
    setIsRequesting(false);
  };

  const isMobile = useIsMobile();

  /*
   * Supports seperate memorization of sidebar state between mobile and desktop
   */
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
                  {/* <SearchChatButton
                    onClick={() => {}}
                    disabled={!hasConversations}
                  /> */}
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
                  {/* <SearchChatButton
                    onClick={() => {}}
                    disabled={!hasConversations}
                  /> */}
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
              <ChatHistory
                onHistoryItemClick={setIsMobileSideBarOpen}
                startNewChat={startNewChat}
              />
            </div>
          </div>

          <div className={styles.content}>
            <ChatView
              introText={modelConfig.introText}
              cautionText={defaultCautionText}
              messages={messages}
              onSubmit={handleChatCompletion}
              onMenu={() => setIsMobileSideBarOpen(true)}
              onNewChat={startNewChat}
              onPanelOpen={() => setIsDesktopSideBarHidden(false)}
              isPanelOpen={!isDesktopSideBarHidden}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </>
  );
};
