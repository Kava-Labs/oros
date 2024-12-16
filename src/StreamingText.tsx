import { useSyncExternalStore } from 'react';
import { TextStreamStore } from './textStreamStore';

interface StreamingTextProps {
  children: (text: string) => React.ReactNode;
  store: TextStreamStore;
}

export const StreamingText = ({ children, store }: StreamingTextProps) => {
  const text = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return <div>{children(text)}</div>;
};
