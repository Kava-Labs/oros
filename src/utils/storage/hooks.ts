import { useEffect } from 'react';
import { LocalStorage } from './index';
import { ChatHistory } from './types';
import { toast } from 'react-toastify';
import { messageHistoryStore, useMessageHistoryStore } from '../../stores';
import { useAppContext } from '../../contexts/AppContext';

/**
 * when messages are added to msgHistory in redux (beyond just the initial system message), sync those messages
 * to local storage
 */
export const useSyncToStorage = (storage: LocalStorage<ChatHistory>) => {
  const { messageHistoryStore } = useAppContext();

  const [msgHistory] = useMessageHistoryStore(messageHistoryStore);

  useEffect(() => {
    //  only write to storage if there's something more than system prompt in redux msgHistory
    //  otherwise, on refresh, redux will initially only have system prompt (before it gets repopulated),
    //  and we don't want to rewrite existing local storage with just the system prompt
    //  if the user has started a conversation
    if (msgHistory.length > 1) {
      try {
        storage.write({
          messages: msgHistory,
        });
      } catch {
        //  edge case where a user's message exceeds local storage limit
        //  https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage
        toast.error('A problem occurred - please try again');
      }
    }
  }, [msgHistory, storage]);
};

/**
 * on initial load or refresh, check if there is a conversation history in local storage
 * if so, set that history in redux, resulting in a persisted UI state (conversation is saved)
 */
export const useSyncFromStorageOnReload = (
  storage: LocalStorage<ChatHistory>,
) => {
  useEffect(() => {
    const syncFromLocalStorage = async () => {
      try {
        const chatHistory = await storage.load();
        const { messages } = chatHistory;
        const hasUserMessagesInLocalStorage = messages && messages.length > 0;
        if (hasUserMessagesInLocalStorage) {
          messageHistoryStore.setState(messages);
        }
      } catch {
        toast.error('There was a problem retrieving your chat messages');
      }
    };

    syncFromLocalStorage();
  }, [storage]);
};
