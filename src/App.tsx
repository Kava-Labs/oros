import { useEffect, useSyncExternalStore, useState } from 'react';
import { ChatView } from './core/components/ChatView';
import { defaultCautionText } from './features/blockchain/config/prompts/defaultPrompts';
import { useAppContext } from './core/context/useAppContext';
import MobileNav from './core/components/NavBar';
import styles from './App.module.css';
import { ChatHistory } from './core/components/ChatHistory';
import { useIsMobile } from './shared/theme/useIsMobile';
import { isInIframe } from './core/utils/isInIframe';
import { X as CloseX, PanelLeftClose } from 'lucide-react';
import KavaAILogo from './core/assets/KavaAILogo';
import ButtonIcon from './core/components/ButtonIcon';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;
const showHistorySidebar = !isInIframe() && FEAT_UPDATED_DESIGN;

export const App = () => {
  const {
    isReady,
    modelConfig,
    messageHistoryStore,
    handleChatCompletion,
    handleReset,
    handleCancel,
  } = useAppContext();

  const messages = useSyncExternalStore(
    messageHistoryStore.subscribe,
    messageHistoryStore.getSnapshot,
  );

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
                <ButtonIcon
                  icon={CloseX}
                  tooltip={{
                    text: 'Close Menu',
                    position: 'bottom',
                  }}
                  aria-label="Close Menu"
                  onClick={() => setIsMobileSideBarOpen(false)}
                />
              )}
              {!isMobile && !isDesktopSideBarHidden && (
                <ButtonIcon
                  icon={PanelLeftClose}
                  tooltip={{
                    text: 'Close Menu',
                    position: 'bottom',
                  }}
                  aria-label="Close Menu"
                  onClick={() => setIsDesktopSideBarHidden(true)}
                />
              )}
            </div>
          </div>

          <div className={styles.content}>
            <ChatView
              introText={modelConfig.introText}
              cautionText={defaultCautionText}
              messages={messages}
              onSubmit={handleChatCompletion}
              onReset={handleReset}
              onMenu={() => setIsMobileSideBarOpen(true)}
              onNewChat={() => {}}
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
