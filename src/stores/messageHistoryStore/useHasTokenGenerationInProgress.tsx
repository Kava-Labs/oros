import { useMessageHistoryStore } from '.';
import { MessageHistoryStore } from './messageHistoryStore';

export const useHasTokenGenerationInProgress = (store: MessageHistoryStore) => {
  const [history] = useMessageHistoryStore(store);

  const lastMsg = history[history.length - 1];
  const isToolCall =
    lastMsg.role === 'assistant' &&
    lastMsg.content === null &&
    Array.isArray(lastMsg.tool_calls);

  if (isToolCall) {
    for (const tc of lastMsg.tool_calls!) {
      if (tc.function.name === 'generateCoinMetadata') return true;
    }
  }

  return false;
};
