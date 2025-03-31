import { useState, useEffect, memo } from 'react';
import { sanitizeContent } from 'lib-kava-ai';
import styles from './Content.module.css';
import { useAppContext } from '../../context/useAppContext';

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
  const { modelConfig } = useAppContext();

  useEffect(() => {
    let cancel = false;

    const handleRender = async () => {
      if (content === '') {
        setSanitizedContent('');
        return;
      }

      try {
        // Process content through model-specific processor if it exists
        let processedContent = content;
        if (modelConfig?.messageProcessors?.postProcess) {
          processedContent = modelConfig.messageProcessors.postProcess(content);
        }

        const updatedContent = await sanitizeContent(processedContent);

        if (!cancel) {
          setSanitizedContent(updatedContent);
        }
      } catch (error) {
        // TODO: This is noisy in tests
        console.error(error);
        if (!cancel) {
          setHasError(true);
        }
      }
    };

    handleRender();

    return () => {
      cancel = true;
    };
  }, [content, modelConfig]);

  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [sanitizedContent, hasError, onRendered]);

  if (hasError) {
    return <span>Error: Could not render content!</span>;
  }

  return (
    <div data-testid="conversation-message" data-chat-role={role}>
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
