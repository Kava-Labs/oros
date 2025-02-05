import { useState } from 'react';
import styles from './NavBar.module.css';
import KavaAILogo from '../assets/KavaAILogo';
import HamburgerIcon from '../assets/HamburgerIcon';
import { isInIframe } from '../utils/isInIframe';
import { useAppContext } from '../context/useAppContext';
import { getAllModels } from '../config/models';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

const NavBar = () => {
  const isIframe = isInIframe();
  const showNavBar = !isIframe && FEAT_UPDATED_DESIGN;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { modelConfig, handleModelChange } = useAppContext();

  if (!showNavBar) return null;

  const ModelIconComponent = modelConfig.icon;

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.menu}>
          <div className={styles.hamburger}>
            <HamburgerIcon />
          </div>
          <div className={styles.logo}>
            <KavaAILogo />
          </div>
        </div>

        <div className={styles.dropdownContainer}>
          <button
            className={styles.dropdown}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <ModelIconComponent />
            <span>{modelConfig.name}</span>
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className={dropdownOpen ? styles.arrowUp : styles.arrowDown}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              {getAllModels().map((model) => {
                const ModelOptionIcon = model.icon;

                return (
                  <button
                    key={model.name}
                    className={styles.dropdownItem}
                    onClick={() => handleModelChange(model.id)}
                  >
                    <ModelOptionIcon />
                    <span>{model.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
