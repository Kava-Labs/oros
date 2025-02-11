import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import { ClipboardCheck, Copy } from 'lucide-react';
import styles from './ChatView.module.css';
import KavaIcon from '../assets/KavaIcon';
import { Content } from './Content';

const AssistantMessage = ({ content }: { content: string }) => {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMobile = useIsMobile();

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
        <Copy
          width="20px"
          cursor="pointer"
          onClick={() => {
            try {
              window.navigator.clipboard.writeText(content);
              setCopied(true);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      ) : (
        <ClipboardCheck
          width="20px"
          cursor="pointer"
          onClick={() => setCopied(false)}
        />
      ),
    [content, copied],
  );

  return (
    <div
      className={styles.left}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <KavaIcon className={styles.conversationChatIcon} />
      <div className={styles.assistantContainer}>
        <Content role="assistant" content={content} />
        <div className={styles.copyIconContainer}>
          {isMobile ? copyIcon : hover ? copyIcon : null}
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;
