import { memo } from 'react';
import { TextStreamStore, useTextStreamStore } from 'lib-kava-ai';
import { ModelConfig } from '../../types/models';

interface StreamingTextProps {
  children: (
    text: string,
    onRendered: () => void,
    modelConfig: ModelConfig,
  ) => React.ReactNode;
  onRendered: () => void;
  store: TextStreamStore;
  modelConfig: ModelConfig;
}

export const StreamingText = memo(function StreamingText({
  children,
  onRendered,
  store,
  modelConfig,
}: StreamingTextProps) {
  const text = useTextStreamStore(store);

  return <div>{children(text, onRendered, modelConfig)}</div>;
});
