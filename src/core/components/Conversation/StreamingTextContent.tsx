import { Content } from './Content';
import { ModelConfig } from '../../types/models';

export const StreamingTextContent = (
  message: string,
  onRendered: () => void,
  modelConfig: ModelConfig,
) => {
  return (
    <Content
      role="assistant"
      content={message}
      onRendered={onRendered}
      modelConfig={modelConfig}
    />
  );
};
