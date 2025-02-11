import { useState, useEffect, memo } from 'react';
import { sanitizeContent } from '../utils/sanitize';
import styles from './ChatView.module.css';
import { useAppContext } from '../context/useAppContext';
import { ThinkingContent } from './ThinkingContent';

export interface ContentProps {
  content: string;
  onRendered?: () => void;
  role: string;
}

export const ContentComponent = ({
  content,
  onRendered,
  role,
}: ContentProps) => {
  const [hasError, setHasError] = useState(false);
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const { modelConfig, isRequesting } = useAppContext();

  useEffect(() => {
    let cancel = false;

    const handleRender = async () => {
      if (content === '') {
        setSanitizedContent('');
        return;
      }

      try {
        let contentToSanitize = content;
        const hasThinkingContent = content.includes('<think>');

        if (hasThinkingContent) {
          const thinkEnd = content.indexOf('</think>');
          if (thinkEnd !== -1) {
            // Only take the content after </think>
            contentToSanitize = content.slice(thinkEnd + 8).trim();
          } else {
            // If we're still streaming the thinking content, don't show anything yet
            contentToSanitize = '';
          }
        }

        // Process content through model-specific processor if it exists
        let processedContent = contentToSanitize;
        if (modelConfig?.messageProcessors?.postProcess) {
          processedContent =
            modelConfig.messageProcessors.postProcess(contentToSanitize);
        }

        const updatedContent = await sanitizeContent(processedContent);

        if (!cancel) {
          setSanitizedContent(updatedContent);
          if (onRendered) {
            requestAnimationFrame(() => {
              if (!cancel) onRendered();
            });
          }
        }
      } catch (error) {
        // TODO: This is noisy in tests
        console.error(error);
        if (!cancel) {
          setHasError(true);
          if (onRendered) {
            requestAnimationFrame(() => {
              if (!cancel) onRendered();
            });
          }
        }
      }
    };

    handleRender();

    return () => {
      cancel = true;
    };
  }, [content, modelConfig, hasError, onRendered]);

  if (hasError) {
    return <span>Error: Could not render content!</span>;
  }

  const hasThinkingContent = content.includes('<think>');

  return (
    <div data-testid="conversation-message" data-chat-role={role}>
      {role === 'assistant' && hasThinkingContent && (
        <ThinkingContent content={content} isStreaming={isRequesting} />
      )}
      {sanitizedContent !== '' && (
        <span
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      )}
    </div>
  );
};

export const Content = memo(ContentComponent);
