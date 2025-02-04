import { useEffect, useState, useCallback } from 'react';
import styles from './NavBar.module.css';
import KavaAILogo from '../assets/KavaAILogo';
import HamburgerIcon from '../assets/HamburgerIcon';
import { isInIframe } from '../utils/isInIframe';
import { useAppContext } from '../context/useAppContext';
import { getAllModels } from '../config/models';
import { ModelConfig } from '../types/models';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

interface NavBarProps {
  setChatHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavBar = ({ setChatHistoryOpen }: NavBarProps) => {
  const isIframe = isInIframe();
  const showNavBar = !isIframe && FEAT_UPDATED_DESIGN;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { modelConfig, handleModelChange, messageHistoryStore } =
    useAppContext();

  const ModelIconComponent = modelConfig.icon;

  const [isDisabled, setIsDisabled] = useState(false);

  // Handle closing dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector(`.${styles.dropdownContainer}`);
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Handle message history changes
  const messages = messageHistoryStore.getSnapshot();
  const hasUserMessages = messages.length > 1;

  useEffect(() => {
    if (hasUserMessages) {
      setIsDisabled(true);
      setDropdownOpen(false);
    } else {
      setIsDisabled(false);
    }
  }, [hasUserMessages]);

  // Keyboard navigation
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (!dropdownOpen) return;
  //
  //     switch (e.key) {
  //       case 'Escape':
  //         setDropdownOpen(false);
  //         break;
  //       case 'ArrowDown': {
  //         e.preventDefault();
  //         const currentIndex = modelOptions.findIndex(
  //           (m) => m.id === selectedModel.id,
  //         );
  //         const nextIndex = (currentIndex + 1) % modelOptions.length;
  //         setSelectedModel(modelOptions[nextIndex]);
  //         break;
  //       }
  //       case 'ArrowUp': {
  //         e.preventDefault();
  //         const currIndex = modelOptions.findIndex(
  //           (m) => m.id === selectedModel.id,
  //         );
  //         const prevIndex =
  //           currIndex === 0 ? modelOptions.length - 1 : currIndex - 1;
  //         setSelectedModel(modelOptions[prevIndex]);
  //         break;
  //       }
  //     }
  //   };
  //
  //   if (dropdownOpen) {
  //     window.addEventListener('keydown', handleKeyDown);
  //     return () => window.removeEventListener('keydown', handleKeyDown);
  //   }
  // }, [dropdownOpen, selectedModel]);
  //
  // const handleSelect = useCallback((model: ModelOption) => {
  //   setSelectedModel(model);
  //   setDropdownOpen(false);
  // }, []);

  const toggleDropdown = useCallback(() => {
    if (!isDisabled) {
      setDropdownOpen((prev) => !prev);
    }
  }, [isDisabled]);

  const handleModelClick = (model: ModelConfig) => {
    handleModelChange(model.id);
    setDropdownOpen(false);
  };

  if (!showNavBar) return null;

  return (
    <div className={styles.container}>
      <nav className={styles.nav} role="navigation">
        <div className={styles.menu}>
          <div
            className={styles.hamburger}
            onClick={() => {
              setChatHistoryOpen((prev) => !prev);
            }}
          >
            <HamburgerIcon />
          </div>
          <div className={styles.logo}>
            <KavaAILogo />
          </div>
        </div>

        <div className={styles.dropdownContainer}>
          <button
            disabled={isDisabled}
            className={styles.dropdown}
            onClick={toggleDropdown}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            aria-label="Select model"
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
              aria-hidden="true"
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
                    onClick={() => handleModelClick(model)}
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
