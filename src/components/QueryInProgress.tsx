import { useAppContext } from '../context/useAppContext';
import { ToolCallStream } from '../toolCallStreamStore';
import { useEffect, useSyncExternalStore } from 'react';

export const QueryInProgress = (_props: ToolCallStream) => {
  const { progressStore } = useAppContext();

  const progressText = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
  );

  useEffect(() => {
    progressStore.setText('query in Progress');
    return () => {
      progressStore.setText('');
    };
  }, [progressStore, progressText]);

  return null;
};
