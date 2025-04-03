import styles from './ChatView.module.css';
import { useTheme } from '../../shared/theme/useTheme';

interface LandingContentProps {
  introText: string;
}

export const LandingContent = ({ introText }: LandingContentProps) => {
  const { logo: Logo } = useTheme();

  return (
    <div className={styles.startContent}>
      <div className={styles.startLogoContainer}>
        {Logo && (
          <Logo width="100%" height="100%" className={styles.startLogo} />
        )}
      </div>
      <h1 className={styles.introText}>{introText}</h1>
    </div>
  );
};
