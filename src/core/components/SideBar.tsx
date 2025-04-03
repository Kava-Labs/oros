import styles from '../../App.module.css';
import { ChatHistory, SideBarControls, useIsMobileLayout } from 'lib-kava-ai';
import type { ConversationHistories } from 'lib-kava-ai';
import { JSX } from 'react';

export interface SideBarProps {
  activeConversationId: string | null;
  conversationHistories: ConversationHistories;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversationTitle: (id: string, newTitle: string) => void;
  onOpenSearchModal: () => void;
  onCloseClick: () => void;
  isSideBarOpen: boolean;
  SideBarLogo: JSX.Element;
}

export const SideBar = ({
  activeConversationId,
  conversationHistories,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversationTitle,
  onOpenSearchModal,
  onCloseClick,
  isSideBarOpen,
  SideBarLogo,
}: SideBarProps) => {
  const isMobileLayout = useIsMobileLayout();
  const isMobileSideBarOpen = isSideBarOpen && isMobileLayout;
  const isDesktopSideBarOpen = isSideBarOpen && !isMobileLayout;
  const sideBarStyles = `${styles.sidebar} ${
    isMobileSideBarOpen ? styles.isOpen : ''
  } ${isDesktopSideBarOpen ? '' : styles.isHidden}`;

  const hasNoConversationHistory =
    Object.keys(conversationHistories).length === 0;

  return (
    <div className={sideBarStyles}>
      <div className={styles.sidebarHeader}>
        {SideBarLogo}
        <div className={styles.buttonGroup}>
          <SideBarControls
            isDisabled={hasNoConversationHistory}
            onCloseClick={onCloseClick}
            onOpenSearchModal={onOpenSearchModal}
          />
        </div>
      </div>

      <div className={styles.sidebarContent}>
        <ChatHistory
          chatHistories={conversationHistories}
          onSelectConversation={onSelectConversation}
          activeConversationId={activeConversationId}
          onDeleteConversation={onDeleteConversation}
          onUpdateConversationTitle={onUpdateConversationTitle}
        />
      </div>
    </div>
  );
};
