import { ChatView } from './ChatView';
import { ModelConfig, SupportedModels } from '../types/models';
import type { ChatCompletionMessageParam } from 'openai/resources';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { ActiveConversation } from '../context/types';

interface ChatViewContainerProps {
  onMenu: () => void;
  onPanelOpen: () => void;
  isPanelOpen: boolean;
  supportsUpload: boolean;
  showModelSelector: boolean;
  startNewChat: () => void;
  conversationID: string;
  modelConfig: ModelConfig;
  activeConversation: ActiveConversation;
  handleChatCompletion: (value: ChatCompletionMessageParam[]) => void;
  handleCancel: () => void;
  handleModelChange: (modelName: SupportedModels) => void;
}
export const ChatViewContainer = ({
  onMenu,
  onPanelOpen,
  isPanelOpen,
  supportsUpload,
  handleModelChange,
  handleCancel,
  handleChatCompletion,
  activeConversation,
  startNewChat,
  modelConfig,
  conversationID,
}: ChatViewContainerProps) => {
  const { messages } = useMessageHistory(
    activeConversation.messageHistoryStore,
  );

  return (
    <ChatView
      handleModelChange={handleModelChange}
      thinkingStore={activeConversation.thinkingStore}
      isRequesting={activeConversation.isRequesting}
      errorStore={activeConversation.errorStore}
      messageStore={activeConversation.messageStore}
      handleCancel={handleCancel}
      handleChatCompletion={handleChatCompletion}
      onMenu={onMenu}
      onPanelOpen={onPanelOpen}
      isPanelOpen={isPanelOpen}
      supportsUpload={supportsUpload}
      showModelSelector={true}
      startNewChat={startNewChat}
      conversationID={conversationID}
      modelConfig={modelConfig}
      messages={messages}
    />
  );
};
