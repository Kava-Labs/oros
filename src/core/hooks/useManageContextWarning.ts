import { useEffect } from 'react';
import { useAppContext } from '../context/useAppContext';
import { ConversationHistory } from '../context/types';
import { ModelConfig } from '../types/models';

const isBelowContextThreshold = (
  conversation: ConversationHistory,
  modelConfig: ModelConfig,
) => {
  const { tokensRemaining } = conversation;
  const { contextLength, contextWarningThresholdPercentage } = modelConfig;

  return (
    (tokensRemaining / contextLength) * 100 <= contextWarningThresholdPercentage
  );
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
  //  show the warning, provided the user hasn't already seen it and toggled it off,
  //  but override that preference when they get dangerously low
  const dangerouslyLowContext =
    currentConversation &&
    currentConversation.tokensRemaining <
      modelConfig.conversationResetTokenThreshold;

  useEffect(() => {
    const shouldShowWarning =
      currentConversation &&
      ((!dismissWarning &&
        isBelowContextThreshold(currentConversation, modelConfig)) ||
        dangerouslyLowContext);

    setShowInputAdornmentMessage(shouldShowWarning);
  }, [
    currentConversation,
    dangerouslyLowContext,
    dismissWarning,
    modelConfig,
    setShowInputAdornmentMessage,
  ]);

  return { shouldDisableChat: dangerouslyLowContext };
};
