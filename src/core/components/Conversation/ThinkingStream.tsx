import { StreamingText } from './StreamingText';
import { ThinkingContent } from './ThinkingContent';
import { useAppContext } from '../../context/useAppContext';

interface ThinkingStreamProps {
  onRendered: () => void;
}

export const ThinkingStream = ({ onRendered }: ThinkingStreamProps) => {
  const { thinkingStore } = useAppContext();

  return (
    <StreamingText store={thinkingStore} onRendered={onRendered}>
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
