import { useAppContext } from '../context/useAppContext';
import { ToolCallStream } from '../toolCallStreamStore';
import { useEffect, useSyncExternalStore } from 'react';

export const QueryInProgress = ({
  onRendered,
}: {
  toolCall: ToolCallStream;
  onRendered?: () => void;
}) => {
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

  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [onRendered]);

  return null;
};
