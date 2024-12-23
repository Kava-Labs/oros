import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './ImageLoader.module.css';

const ImageLoader = ({ prompt }: { prompt: string }) => {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const words = prompt.split(' ');
  useEffect(() => {
    if (currentIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedWords((prev) => [...prev, words[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, 200);

      return () => clearTimeout(timer);
    } else {
      const resetTimer = setTimeout(() => {
        setDisplayedWords([]);
        setCurrentIndex(0);
      }, 2000);

      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex, prompt, words]);

  return (
    <div className={styles.container} role="status">
      <div className={styles.spinnerContainer}>
        <Loader2 className={styles.spinner} />
      </div>

      <div className={styles.content}>
        <h4>Generating your image...</h4>

        <div className={styles.promptContainer}>
          <p>
            {displayedWords.join(' ')}
            <span className={styles.cursor}>|</span>
          </p>
        </div>

        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            style={{
              width: `${(displayedWords.length / words.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageLoader;
