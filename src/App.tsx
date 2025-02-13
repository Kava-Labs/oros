import { useEffect, useSyncExternalStore, useState } from 'react';
import { ChatView } from './core/components/ChatView';
import { defaultCautionText } from './features/blockchain/config/prompts/defaultPrompts';
import { useAppContext } from './core/context/useAppContext';
import MobileNav from './core/components/NavBar';
import styles from './App.module.css';
import { ChatHistory } from './core/components/ChatHistory';
import { useIsMobile } from './shared/theme/useIsMobile';
import { isInIframe } from './core/utils/isInIframe';

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
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);

  useEffect(() => {
    // when not on mobile the toggle should always be reset back to false
    if (!isMobile && chatHistoryOpen) {
      setChatHistoryOpen(false);
    }
  }, [chatHistoryOpen, isMobile]);

  return (
    <>
      {isReady && (
        <div className={styles.appContent}>
          {isMobile && (
            <MobileNav
              chatHistoryOpen={chatHistoryOpen}
              setChatHistoryOpen={setChatHistoryOpen}
            />
          )}
          {showHistorySidebar ? (
            <div className={styles.appContainer}>
              {!isMobile ? (
                <ChatHistory setChatHistoryOpen={setChatHistoryOpen} />
              ) : chatHistoryOpen ? (
                <ChatHistory setChatHistoryOpen={setChatHistoryOpen} />
              ) : null}
              {!chatHistoryOpen ? (
                <ChatView
                  introText={modelConfig.introText}
                  cautionText={defaultCautionText}
                  messages={messages}
                  onSubmit={handleChatCompletion}
                  onReset={handleReset}
                  onCancel={handleCancel}
                />
              ) : null}
            </div>
          ) : (
            <ChatView
              introText={modelConfig.introText}
              cautionText={defaultCautionText}
              messages={messages}
              onSubmit={handleChatCompletion}
              onReset={handleReset}
              onCancel={handleCancel}
            />
          )}
        </div>
      )}
    </>
  );
};
