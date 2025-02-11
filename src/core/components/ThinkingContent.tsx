import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './ThinkingContent.module.css';
import { BrainIcon } from '../assets/BrainIcon';
import { useTheme } from '../../shared/theme/useTheme';

const ThinkingDots = () => (
  <div className={styles.dotsContainer}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={styles.dot}
        style={{
          animationDelay: `${i * 200}ms`,
        }}
      />
    ))}
  </div>
);

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
  }, [onRendered]);

  // If there's no thinking content, don't render anything
  if (!content) {
    return null;
  }

  const showLoadingState = isStreaming;

  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
    }
  }, [isStreaming]);

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
          className={styles.iconContainer}
          style={{
            background: isExpanded
              ? 'var(--colors-accentBorder)'
              : 'rgba(255, 67, 62, 0.1)',
          }}
        >
          <BrainIcon
            color={colors.accent}
            className={styles.icon}
            style={{
              opacity: isExpanded ? 1 : 0.7,
            }}
          />
        </div>

        <span className={styles.headerText}>
          {showLoadingState ? 'Thinking' : 'Thinking Process'}
          {showLoadingState && <ThinkingDots />}
        </span>

        <ChevronDown
          size={20}
          className={styles.chevron}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'none',
          }}
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
