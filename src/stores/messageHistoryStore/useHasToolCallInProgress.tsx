import { MessageHistoryStore } from './messageHistoryStore';
import { useMessageHistoryStore } from './useMessageHistoryStore';

export const useHasToolCallInProgress = (store : MessageHistoryStore) => {
  const [history] = useMessageHistoryStore(store);

  const lastMsg = history[history.length - 1];
  return (
    lastMsg.role === 'assistant' &&
    lastMsg.content === null &&
    Array.isArray(lastMsg.tool_calls)
  );
};
