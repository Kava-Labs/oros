import { useAppContext } from '../../../../core/context/useAppContext';
import { useEffect, useSyncExternalStore } from 'react';
import { useScrollToBottom } from '../../../../core/utils/useScrollToBottom';
import { ToolCallStream } from '../../../../core/stores/toolCallStreamStore';

export interface InProgressQueryProps {
  onRendered?: () => void;
  toolCall: ToolCallStream;
}

export const InProgressQueryDisplay = ({
  onRendered,
}: InProgressQueryProps) => {
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
