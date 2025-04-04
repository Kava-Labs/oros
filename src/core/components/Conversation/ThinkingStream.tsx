import { StreamingText } from './StreamingText';
import { ThinkingContent } from './ThinkingContent';
import { ModelConfig } from '../../types/models';
import { TextStreamStore } from 'lib-kava-ai';

interface ThinkingStreamProps {
  onRendered: () => void;
  modelConfig: ModelConfig;
  thinkingStore: TextStreamStore;
}

export const ThinkingStream = ({
  onRendered,
  modelConfig,
  thinkingStore,
}: ThinkingStreamProps) => {
  return (
    <StreamingText
      store={thinkingStore}
      onRendered={onRendered}
      modelConfig={modelConfig}
    >
      {(msg) => (
        <ThinkingContent
          content={msg}
          isStreaming={true}
          onRendered={onRendered}
        />
      )}
    </StreamingText>
  );
};
