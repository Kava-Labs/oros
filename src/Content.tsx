import { useState, useEffect, memo } from 'react';
import { sanitizeContent } from './sanitize';
import styles from './Content.module.css';
import { unmaskAddresses } from './utils/chat/unmaskAddresses';
import { getStoredMasks } from './utils/chat/helpers';

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
  const storedMasks = getStoredMasks();

  useEffect(() => {
    let cancel = false;

    const handleRender = async () => {
      if (content === '') {
        setSanitizedContent('');
        return;
      }

      try {
        const updatedContent = await sanitizeContent(
          unmaskAddresses(content, storedMasks.masksToValues),
        );
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
  }, [content, storedMasks.masksToValues]);

  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [sanitizedContent, hasError, onRendered]);

  if (hasError) {
    return <span>Error: Could not render content!</span>;
  }

  return (
    <div
      data-testid="conversation-message"
      data-chat-role={role}
      className={styles.messageContainer}
    >
      {sanitizedContent !== '' && (
        <span
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        ></span>
      )}
    </div>
  );
};

export const Content = memo(ContentComponent);
