import { useState, useEffect, memo } from 'react';
import { sanitizeContent } from './sanitize';
import { unmaskAddresses } from './utils/chat/unmaskAddresses';
import { enforceLineBreak, getStoredMasks } from './utils/chat/helpers';

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
          enforceLineBreak(unmaskAddresses(content, storedMasks.masksToValues)),
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
    <div data-testid="conversation-message" data-chat-role={role}>
      {sanitizedContent !== '' && (
        <span
          dangerouslySetInnerHTML={{
            __html: sanitizedContent,
          }}
        ></span>
      )}
    </div>
  );
};

export const Content = memo(ContentComponent);
