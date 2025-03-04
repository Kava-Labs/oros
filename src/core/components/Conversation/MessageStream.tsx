import { StreamingText } from './StreamingText';
import { StreamingTextContent } from './StreamingTextContent';
import { useAppContext } from '../../context/useAppContext';

interface MessageStreamProps {
  onRendered: () => void;
}

export const MessageStream = ({ onRendered }: MessageStreamProps) => {
  const { messageStore } = useAppContext();

  return (
    <StreamingText store={messageStore} onRendered={onRendered}>
      {StreamingTextContent}
    </StreamingText>
  );
};
