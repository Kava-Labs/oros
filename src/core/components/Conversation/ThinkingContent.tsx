import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './ThinkingContent.module.css';
import { BrainIcon } from '../../assets/BrainIcon';
import { useTheme } from '../../../shared/theme/useTheme';

interface ThinkingContentProps {
  content: string;
  isStreaming?: boolean;
  onRendered?: () => void;
}

export const ThinkingContent = ({
  content,
  isStreaming = false,
  onRendered,
}: ThinkingContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { colors } = useTheme();

  useEffect(() => {
    if (onRendered) {
      requestAnimationFrame(onRendered);
    }
  }, [onRendered, content]);

  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
    }
  }, [isStreaming]);

  // If there's no thinking content, don't render anything
  if (!content || !content.trim()) {
    return null;
  }

  const showLoadingState = isStreaming;

  const renderThinkingContent = () => {
    if (!content) return null;

    return content.split('\n').map((line, i) => (
      <p
        key={i}
        className={styles.paragraph}
        style={{
          opacity: isExpanded ? 1 : 0,
          transform: isExpanded ? 'translateY(0)' : 'translateY(8px)',
          transitionDelay: `${i * 100}ms`,
          whiteSpace: 'pre-wrap', // Ensures that spaces and newlines are preserved
        }}
      >
        {line}
      </p>
    ));
  };

  return (
    <div className={styles.thinkingSection}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={styles.header}
      >
        <div
          className={`${styles.iconContainer} ${
            showLoadingState ? styles.pulsing : ''
          }`}
          style={{
            background: isExpanded
              ? 'var(--colors-accentTwoBorder)'
              : 'rgba(255, 67, 62, 0.1)',
          }}
        >
          <BrainIcon
            color={colors.accentTwo}
            className={`${styles.icon} ${showLoadingState ? styles.pulsing : ''}`}
            style={{
              opacity: isExpanded ? 1 : 0.7,
            }}
            aria-label="thinking"
          />
        </div>

        <span className={styles.headerText}>
          {showLoadingState ? 'Thinking' : 'Thinking Process'}
        </span>

        <ChevronDown
          size={20}
          className={styles.chevron}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'none',
          }}
          aria-label={
            isExpanded ? 'collapse thinking conent' : 'expand thinking conent'
          }
        />
      </button>

      <div
        className={styles.thinkingContentWrapper}
        style={{
          maxHeight: isExpanded ? '2000px' : '0',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className={styles.thinkingContent}>
          <div className={styles.thinkingText}>{renderThinkingContent()}</div>
        </div>
      </div>
    </div>
  );
};
