import { useEffect, useSyncExternalStore } from 'react';
import { ToolCallStream } from '../../../core/stores/toolCallStreamStore';
import { useAppContext } from '../../../core/context/useAppContext';
import { useScrollToBottom } from '../../../core/utils/useScrollToBottom';

export const ConnectWalletPrompt = ({
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
    progressStore.setText('Connect your wallet to continue');
    return () => {
      progressStore.setText('');
    };
  }, [progressStore, progressText]);

  useScrollToBottom(onRendered);

  return null;
};
