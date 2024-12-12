import kavaLogo from '../../assets/kavaLogo.svg';
import styles from './styles.module.css';

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <img src={kavaLogo} alt="Logo" height={35} />
      </div>
    </header>
  );
};
