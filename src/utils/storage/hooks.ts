import {
  appStore as _appStore,
  messageHistorySet,
  selectMessageHistory,
} from '../../stores';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { LocalStorage } from './index';
import { ChatHistory } from './types';
import { toast } from 'react-toastify';

/**
 * when messages are added to msgHistory in redux (beyond just the initial system message), sync those messages
 * to local storage
 */
export const useSyncToStorage = (storage: LocalStorage<ChatHistory>) => {
  const msgHistory = useSelector(selectMessageHistory);

  useEffect(() => {
    //  only write to storage if there's something more than system prompt in redux msgHistory
    //  otherwise, on refresh, redux will initially only have system prompt (before it gets repopulated),
    //  and we don't want to rewrite existing local storage with just the system prompt
    //  if the user has started a conversation
    if (msgHistory.length > 1) {
      storage.write({
        messages: msgHistory,
      });
    }
  }, [msgHistory, storage]);
};

export const useSyncFromStorageOnReload = (
  storage: LocalStorage<ChatHistory>,
  store: typeof _appStore,
) => {
  useEffect(() => {
    const syncFromLocalStorage = async () => {
      try {
        const chatHistory = await storage.load();
        const { messages } = chatHistory;
        const hasUserMessagesInLocalStorage = messages && messages.length > 0;
        if (hasUserMessagesInLocalStorage) {
          store.dispatch(messageHistorySet(messages));
        }
      } catch {
        toast.error('There was a problem retrieving your chat messages');
      }
    };

    syncFromLocalStorage();
  }, [storage, store]);
};
