import { ToolCallStream } from '../toolCallStreamStore';
import { useEffect, useSyncExternalStore } from 'react';
import { progressStore } from '../store';

export const QueryInProgress = (_props: ToolCallStream) => {
  const progressText = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
  );

  useEffect(() => {
    progressStore.setText('query in Progress');
    return () => {
      progressStore.setText('');
    };
  }, [progressText]);

  return null;
};
