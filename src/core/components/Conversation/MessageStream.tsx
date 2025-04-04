import { StreamingText } from './StreamingText';
import { StreamingTextContent } from './StreamingTextContent';
import { useAppContext } from '../../context/useAppContext';
import { ModelConfig } from '../../types/models';

interface MessageStreamProps {
  onRendered: () => void;
  modelConfig: ModelConfig;
}

export const MessageStream = ({
  onRendered,
  modelConfig,
}: MessageStreamProps) => {
  const { messageStore } = useAppContext();

  return (
    <StreamingText
      store={messageStore}
      onRendered={onRendered}
      modelConfig={modelConfig}
    >
      {StreamingTextContent}
    </StreamingText>
  );
};
