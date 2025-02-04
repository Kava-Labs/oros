import { JSX, useState } from 'react';
import styles from './NavBar.module.css';
import DeepseekIcon from '../../features/reasoning/assets/DeepseekIcon';
import KavaAILogo from '../../shared/assets/KavaAILogo';
import HamburgerIcon from '../../shared/assets/HamburgerIcon';
import { isInIframe } from '../utils/isInIframe';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

interface ModelOption {
  id: string;
  name: string;
  icon: JSX.Element;
}

const modelOptions: ModelOption[] = [
  { id: 'deepseek', name: 'DeepSeek RI 67TB', icon: <DeepseekIcon /> },
  { id: 'kavaai', name: 'Kava AI', icon: <>Logo coming soon</> },
];

const NavBar = () => {
  const isIframe = isInIframe();
  const showNavBar = !isIframe && FEAT_UPDATED_DESIGN;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);

  if (!showNavBar) return null;

  const handleSelect = (model: ModelOption) => {
    setSelectedModel(model);
    setDropdownOpen(false);
  };

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
            {selectedModel.icon}
            <span>{selectedModel.name}</span>
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
              {modelOptions.map((model) => (
                <button
                  key={model.id}
                  className={styles.dropdownItem}
                  onClick={() => handleSelect(model)}
                >
                  {model.icon}
                  <span>{model.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
