import { memo, useSyncExternalStore } from 'react';
import { TextStreamStore } from '../textStreamStore';

interface StreamingTextProps {
  children: (text: string, onRendered: () => void) => React.ReactNode;
  onRendered: () => void;
  store: TextStreamStore;
}

export const StreamingText = memo(function StreamingText({
  children,
  onRendered,
  store,
}: StreamingTextProps) {
  const text = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return <div>{children(text, onRendered)}</div>;
});
