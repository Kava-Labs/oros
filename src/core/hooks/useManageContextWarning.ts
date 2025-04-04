import { useEffect, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { ConversationHistory, getConversation } from 'lib-kava-ai';
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

  const [currentConversation, setCurrentConversation] =
    useState<ConversationHistory | null>(null);

  useEffect(() => {
    getConversation(conversationID)
      .then(setCurrentConversation)
      .catch(console.error);
  }, [conversationID]);

  //  when a user changes to another conversation (existing or new),
  //  reset all state
  useEffect(() => {
    setShowInputAdornmentMessage(false);
    setDismissWarning(false);
  }, [conversationID, setDismissWarning, setShowInputAdornmentMessage]);

  //  when an existing conversation goes below the threshold,
  //  show the warning, provided the user hasn't already seen it and toggled it off,
  //  but override that preference when they get dangerously low
  const dangerouslyLowContext: boolean =
    currentConversation !== null &&
    currentConversation.tokensRemaining <
      modelConfig.conversationResetTokenThreshold;

  useEffect(() => {
    const shouldShowWarning: boolean =
      currentConversation !== null &&
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
