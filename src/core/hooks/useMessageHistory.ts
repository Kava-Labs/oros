import { useMemo, useSyncExternalStore } from 'react';
import { useAppContext } from '../context/useAppContext';

export function useMessageHistory() {
  const { messageHistoryStore } = useAppContext();

  const messages = useSyncExternalStore(
    messageHistoryStore.subscribe,
    messageHistoryStore.getSnapshot,
  );

  const hasMessages = useMemo(
    () => messages.filter((message) => message.role !== 'system').length > 0,
    [messages],
  );

  const userMessageCount = useMemo(
    () => messages.filter((message) => message.role !== 'system').length,
    [messages],
  );

  const lastUserMessage = useMemo(
    () => messages.filter((message) => message.role !== 'system').slice(-1)[0],
    [messages],
  );

  return {
    messages,
    hasMessages,
    userMessageCount,
    lastUserMessage,
  };
}
