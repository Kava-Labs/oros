import styles from './NavBar.module.css';
import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/useAppContext';

interface ModelDropdownButtonProps {
  dropdownOpen: boolean;
  setDropdownOpen: (dropdownOpen: boolean) => void;
}

const ModelDropdownButton = ({
  dropdownOpen,
  setDropdownOpen,
}: ModelDropdownButtonProps) => {
  const [isDisabled, setIsDisabled] = useState(false);

  const { modelConfig, messageHistoryStore } = useAppContext();

  const ModelIconComponent = modelConfig.icon;

  const toggleDropdown = useCallback(() => {
    if (!isDisabled) {
      setDropdownOpen(!dropdownOpen);
    }
  }, [dropdownOpen, isDisabled, setDropdownOpen]);

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
  }, [hasUserMessages, setDropdownOpen]);

  return (
    <button
      disabled={isDisabled}
      className={styles.dropdown}
      onClick={toggleDropdown}
      aria-haspopup="true"
      aria-expanded={dropdownOpen}
      aria-label="Select model"
    >
      <div className={styles.modelOption}>
        <div className={styles.modelInfo}>
          <ModelIconComponent />
          <div className={styles.nameContainer}>
            <h6>{modelConfig.name}</h6>
            <span className={styles.description}>
              {modelConfig.description}
            </span>
          </div>
        </div>
      </div>

      <svg
        width="24"
        height="24"
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
          d="M19 9l-9 9-9-9"
        />
      </svg>
    </button>
  );
};

export default ModelDropdownButton;
