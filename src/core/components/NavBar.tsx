import styles from './NavBar.module.css';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

const NavBar = () => {
  const isInIframe = window !== window.parent;
  const showNavBar = !isInIframe && FEAT_UPDATED_DESIGN;

  if (!showNavBar) return null;

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.kava}>Kava</span>
          <span className={styles.ai}>AI</span>
        </div>

        <button className={styles.dropdown}>
          <span>DeepSeek RI 67TB</span>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default NavBar;
