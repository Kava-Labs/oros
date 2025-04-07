import { ChatView } from './ChatView';
import { ModelConfig, SupportedModels } from '../types/models';
import type { TextStreamStore } from 'lib-kava-ai';
import type { ChatCompletionMessageParam } from 'openai/resources';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { MessageHistoryStore } from '../stores/messageHistoryStore';

interface ChatViewContainerProps {
  onMenu: () => void;
  onPanelOpen: () => void;
  isPanelOpen: boolean;
  supportsUpload: boolean;
  showModelSelector: boolean;
  startNewChat: () => void;
  conversationID: string;
  modelConfig: ModelConfig;
  errorStore: TextStreamStore;
  messageStore: TextStreamStore;
  thinkingStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
  isRequesting: boolean;
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
  thinkingStore,
  messageHistoryStore,
  isRequesting,
  errorStore,
  messageStore,
  startNewChat,
  modelConfig,
  conversationID,
}: ChatViewContainerProps) => {
  const { messages } = useMessageHistory(messageHistoryStore);

  return (
    <ChatView
      handleModelChange={handleModelChange}
      thinkingStore={thinkingStore}
      isRequesting={isRequesting}
      errorStore={errorStore}
      messageStore={messageStore}
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
