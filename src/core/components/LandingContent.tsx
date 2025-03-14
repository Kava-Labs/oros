import styles from './ChatView.module.css';
import { useTheme } from '../../shared/theme/useTheme';
import { useAppContext } from '../context/useAppContext';

export const LandingContent = () => {
  const { logo: Logo } = useTheme();
  const {
    modelConfig: { introText },
  } = useAppContext();

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
