import { useState } from 'react';
import { ChatView } from './core/components/ChatView';
import { useAppContext } from './core/context/useAppContext';
import styles from './App.module.css';
import { useIsMobileLayout } from 'lib-kava-ai';
import KavaAILogo from './core/assets/KavaAILogo';
import { SearchHistoryModal } from 'lib-kava-ai';
import { SideBar } from './core/components/SideBar';
import { useSession } from './useSession';

export const App = () => {
  const {
    isReady,
    modelConfig,
    startNewChat,
    onSelectConversation,
    onDeleteConversation,
    onUpdateConversationTitle,
    conversationID,
    conversations,
    searchableHistory,
    fetchSearchHistory,
  } = useAppContext();
  const { supportedFileTypes } = modelConfig;
  const [isMobileSideBarOpen, setIsMobileSideBarOpen] = useState(false);
  const [isDesktopSideBarOpen, setIsDesktopSideBarOpen] = useState(true);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  
  useSession();

  const onOpenSearchModal = async () => {
    await fetchSearchHistory();
    setIsSearchHistoryOpen(true);
  };
  const onCloseSearchHistory = () => {
    setIsSearchHistoryOpen(false);
  };

  const isMobileLayout = useIsMobileLayout();

  const onCloseSideBar = isMobileLayout
    ? () => setIsMobileSideBarOpen(false)
    : () => setIsDesktopSideBarOpen(false);

  const isSideBarOpen = isMobileLayout
    ? isMobileSideBarOpen
    : isDesktopSideBarOpen;

  return (
    <>
      {isReady && (
        <div className={styles.app}>
          <SideBar
            activeConversationId={conversationID}
            conversationHistories={conversations}
            onCloseClick={onCloseSideBar}
            onDeleteConversation={onDeleteConversation}
            onOpenSearchModal={onOpenSearchModal}
            onSelectConversation={onSelectConversation}
            onUpdateConversationTitle={onUpdateConversationTitle}
            isSideBarOpen={isSideBarOpen}
            SideBarLogo={<KavaAILogo height={20} />}
          />
          <div className={styles.content}>
            <ChatView
              onMenu={() => setIsMobileSideBarOpen(true)}
              onPanelOpen={() => setIsDesktopSideBarOpen(true)}
              isPanelOpen={isDesktopSideBarOpen}
              supportsUpload={supportedFileTypes.length > 0}
              showModelSelector={true}
              startNewChat={startNewChat}
              conversationID={conversationID}
              modelConfig={modelConfig}
            />
          </div>
          {isSearchHistoryOpen && searchableHistory && (
            <SearchHistoryModal
              searchableHistory={searchableHistory}
              onSelectConversation={onSelectConversation}
              onCloseSearchHistory={onCloseSearchHistory}
            />
          )}
        </div>
      )}
    </>
  );
};
