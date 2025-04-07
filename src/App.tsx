import { useState } from 'react';
import { ChatView } from './core/components/ChatView';
import { useChat } from './core/context/useChat';
import styles from './App.module.css';
import KavaAILogo from './core/assets/KavaAILogo';
import { SearchHistoryModal, SideBar, useIsMobileLayout } from 'lib-kava-ai';
import { useSession } from './useSession';

export const App = () => {
  const {
    isRequesting,
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
    messageHistoryStore,
    errorStore,
    messageStore,
    handleCancel,
    handleChatCompletion,
    thinkingStore,
    handleModelChange,
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
          />
          <div className={styles.content}>
            <ChatView
              handleModelChange={handleModelChange}
              thinkingStore={thinkingStore}
              messageHistoryStore={messageHistoryStore}
              isRequesting={isRequesting}
              errorStore={errorStore}
              messageStore={messageStore}
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
