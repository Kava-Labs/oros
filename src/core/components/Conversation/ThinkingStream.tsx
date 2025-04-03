import { StreamingText } from './StreamingText';
import { ThinkingContent } from './ThinkingContent';
import { useAppContext } from '../../context/useAppContext';
import { ModelConfig } from '../../types/models';

interface ThinkingStreamProps {
  onRendered: () => void;
  modelConfig: ModelConfig;
}

export const ThinkingStream = ({
  onRendered,
  modelConfig,
}: ThinkingStreamProps) => {
  const { thinkingStore } = useAppContext();

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
