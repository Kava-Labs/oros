import { useEffect } from 'react';
import { useAppContext } from '../context/useAppContext';
import { ConversationHistory } from '../context/types';
import { ModelConfig } from '../types/models';

const isBelowContextThreshold = (
  conversation: ConversationHistory,
  modelConfig: ModelConfig,
) => {
  const { tokensRemaining } = conversation;
  const { contextLength, contextThresholdPercentage } = modelConfig;

  return (tokensRemaining / contextLength) * 100 <= contextThresholdPercentage;
};

export const useManageContextWarning = (
  dismissWarning: boolean,
  setDismissWarning: (dismiss: boolean) => void,
  setShowInputAdornmentMessage: (show: boolean) => void,
) => {
  const { conversationID, modelConfig } = useAppContext();

  const allConversations: Record<string, ConversationHistory> = JSON.parse(
    localStorage.getItem('conversations') ?? '{}',
  );

  const currentConversation = allConversations[conversationID];

  //  when a user changes to another conversation (existing or new),
  //  reset all state
  useEffect(() => {
    setShowInputAdornmentMessage(false);
    setDismissWarning(false);
  }, [conversationID, setDismissWarning, setShowInputAdornmentMessage]);

  //  when an existing conversation goes below the threshold,
  //  show the warning, provided the user hasn't already seen it and toggled it off
  useEffect(() => {
    if (
      currentConversation &&
      !dismissWarning &&
      isBelowContextThreshold(currentConversation, modelConfig)
    ) {
      setShowInputAdornmentMessage(true);
    }
  }, [
    currentConversation,
    dismissWarning,
    modelConfig,
    setShowInputAdornmentMessage,
  ]);
};
