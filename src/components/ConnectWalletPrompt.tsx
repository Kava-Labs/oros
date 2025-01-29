import { useEffect, useSyncExternalStore } from 'react';
import { ToolCallStream } from '../toolCallStreamStore';
import { useAppContext } from '../context/useAppContext';
import { useScrollToBottom } from '../useScrollToBottom';

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
