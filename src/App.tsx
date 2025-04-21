import { useState } from 'react';
import { useChat } from './core/context/useChat';
import styles from './App.module.css';
import KavaAILogo from './core/assets/KavaAILogo';
import { SearchHistoryModal, SideBar, useIsMobileLayout } from 'lib-kava-ai';
import { useSession } from './useSession';
import { ChatViewContainer } from './core/components/ChatViewContainer';

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
    handleCancel,
    handleChatCompletion,
    handleModelChange,
    activeConversation,
  } = useChat();

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
            styles={styles}
            links={[
              {
                title: 'Oros',
                url: 'https://oros.kava.io/',
              },
            ]}
          />
          <div className={styles.content}>
            <ChatViewContainer
              handleModelChange={handleModelChange}
              activeConversation={activeConversation}
              handleCancel={handleCancel}
              handleChatCompletion={handleChatCompletion}
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
