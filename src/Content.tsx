import { useState, useEffect, memo } from 'react';
import { sanitizeContent } from './sanitize';
import styles from './ChatView.module.css';

export interface ContentProps {
  content: string;
  onRendered(): void;
  role: string;
}

export const ContentComponent = ({
  content,
  onRendered,
  role,
}: ContentProps) => {
  const [hasError, setHasError] = useState(false);
  const [sanitizedContent, setSanitizedContent] = useState<string>('');

  useEffect(() => {
    let cancel = false;

    const handleRender = async () => {
      if (content === '') {
        if (sanitizedContent !== '') {
          setSanitizedContent('');
        }
        return;
      }

      try {
        const updatedContent = await sanitizeContent(content);
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
  }, [content, sanitizedContent, setSanitizedContent]);

  useEffect(() => {
    requestAnimationFrame(onRendered);
  }, [sanitizedContent, hasError, onRendered]);

  if (hasError) {
    return <span>Error: Could not render content!</span>;
  }

  return (
    <div data-chat-role={role}>
      {sanitizedContent !== '' && (
        <span
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        ></span>
      )}
    </div>
  );
};

export const Content = memo(ContentComponent, (prevProps, curProps) => {
  // todo: do we need this callback function?
  return (
    prevProps.content === curProps.content &&
    prevProps.onRendered === curProps.onRendered &&
    prevProps.role === curProps.role
  );
});
