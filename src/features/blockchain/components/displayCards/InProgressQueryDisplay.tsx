import { useAppContext } from '../../../../context/useAppContext';
import { ToolCallStream } from '../../../../toolCallStreamStore';
import { useEffect, useSyncExternalStore } from 'react';
import { useScrollToBottom } from '../../../../useScrollToBottom';

export const InProgressQueryDisplay = ({
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
    progressStore.setText('Query in Progress');
    return () => {
      progressStore.setText('');
    };
  }, [progressStore, progressText]);

  useScrollToBottom(onRendered);

  return null;
};
