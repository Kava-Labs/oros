import AssistantMessage from './AssistantMessage';

interface AssistantMessageContainerProps {
  content: string;
  reasoningContent?: string;
}

export const AssistantMessageContainer = ({
  content,
  reasoningContent,
}: AssistantMessageContainerProps) => {
  return (
    <AssistantMessage content={content} reasoningContent={reasoningContent} />
  );
};
