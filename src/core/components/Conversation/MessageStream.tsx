import { StreamingText } from './StreamingText';
import { StreamingTextContent } from './StreamingTextContent';
import { ModelConfig } from '../../types/models';
import type { TextStreamStore } from 'lib-kava-ai';

interface MessageStreamProps {
  onRendered: () => void;
  modelConfig: ModelConfig;
  messageStore: TextStreamStore;
}

export const MessageStream = ({
  onRendered,
  modelConfig,
  messageStore,
}: MessageStreamProps) => {
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
