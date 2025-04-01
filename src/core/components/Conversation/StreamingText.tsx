import { memo } from 'react';
import { TextStreamStore, useTextStreamStore } from 'lib-kava-ai';

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
  const text = useTextStreamStore(store);

  return <div>{children(text, onRendered)}</div>;
});
