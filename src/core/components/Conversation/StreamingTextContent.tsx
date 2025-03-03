import { Content } from './Content';

export const StreamingTextContent = (
  message: string,
  onRendered: () => void,
) => {
  return <Content role="assistant" content={message} onRendered={onRendered} />;
};
