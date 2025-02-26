import { useEffect } from 'react';
import { useAppContext } from '../context/useAppContext';
import { ConversationHistory } from '../context/types';

export const useManageContextWarning = (
  dismissWarning: boolean,
  setDismissWarning: (dismiss: boolean) => void,
  setShowInputAdornmentMessage: (show: boolean) => void,
) => {
  const { conversationID } = useAppContext();

  const allConversations: Record<string, ConversationHistory> = JSON.parse(
    localStorage.getItem('conversations') ?? '{}',
  );

  const currentConversation = allConversations[conversationID];

  //  when a user changes to another conversation or starts a new one,
  //  reset dismissal so they get the warning
  useEffect(() => {
    setDismissWarning(false);
  }, [conversationID, setDismissWarning]);

  //  when an existing conversation goes over the threshold,
  //  show the warning, provided the user hasn't already seen it and toggled it off
  useEffect(() => {
    if (
      currentConversation &&
      //  todo - determine threshold
      // currentConversation.tokensRemaining < ? &&
      !dismissWarning
    ) {
      // setShowInputAdornmentMessage(true);
    }
  }, [currentConversation, dismissWarning, setShowInputAdornmentMessage]);
};
