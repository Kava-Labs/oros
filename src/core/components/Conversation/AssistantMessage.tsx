import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Copy } from 'lucide-react';
import { useIsMobileLayout } from 'lib-kava-ai';
import styles from './Conversation.module.css';
import { Content } from './Content';
import { ThinkingContent } from './ThinkingContent';
import ButtonIcon from '.././ButtonIcon';
import { ModelConfig } from '../../types/models';

const AssistantMessage = ({
  content,
  reasoningContent,
  modelConfig,
}: {
  content: string;
  reasoningContent?: string;
  modelConfig: ModelConfig;
}) => {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMobileLayout = useIsMobileLayout();

  useEffect(() => {
    let id: NodeJS.Timeout;

    if (copied) {
      id = setTimeout(() => {
        setCopied(false);
      }, 1000);
    }

    return () => {
      if (id) {
        clearTimeout(id);
      }
    };
  }, [copied]);

  const copyIcon = useMemo(
    () =>
      !copied ? (
        <ButtonIcon
          icon={Copy}
          aria-label="Copy Chat"
          onClick={() => {
            try {
              window.navigator.clipboard.writeText(content.trim());
              setCopied(true);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      ) : (
        <ButtonIcon
          icon={ClipboardCheck}
          aria-label="Chat Copied"
          onClick={() => setCopied(false)}
        />
      ),
    [content, copied],
  );

  return (
    <div
      className={styles.assistantOutputContainer}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={styles.assistantContainer}>
        {reasoningContent ? (
          <ThinkingContent content={reasoningContent} />
        ) : null}
        <Content role="assistant" content={content} modelConfig={modelConfig} />
        <div className={styles.copyIconContainer}>
          {isMobileLayout ? copyIcon : hover ? copyIcon : null}
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;
