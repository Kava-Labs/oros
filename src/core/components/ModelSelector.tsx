import styles from './ModelDropdown.module.css';
import { useEffect, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { getAllModels } from '../config/models';
import { SupportedModels } from '../types/models';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import Tooltip from './Tooltip';

export const ModelSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const { modelConfig, messageHistoryStore, handleModelChange } =
    useAppContext();
  const SelectedModelIcon = modelConfig.icon;
  const isMobile = useIsMobile();

  // Check for existing messages
  // Handle disabled state based on message history
  const messages = messageHistoryStore.getSnapshot();
  const hasUserMessages = messages.length > 1;

  useEffect(() => {
    if (hasUserMessages) {
      setIsDisabled(true);
      setIsOpen(false);
    } else {
      setIsDisabled(false);
    }
  }, [hasUserMessages]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const container = document.querySelector(`.${styles.dropdownContainer}`);
      if (container && !container.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (modelId: SupportedModels) => {
    handleModelChange(modelId);
    setIsOpen(false);
  };

  const button = (
    <button
      className={styles.dropdownButton}
      onClick={() => !isDisabled && setIsOpen(!isOpen)}
      disabled={isDisabled}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <div className={styles.modelInfo}>
        <SelectedModelIcon />
        <span>{modelConfig.name}</span>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );

  return (
    <div className={styles.dropdownContainer}>
      {isDisabled ? (
        <Tooltip
          content="Model switching is disabled once a chat has started"
          topMargin={isMobile ? '100' : '65'}
        >
          {button}
        </Tooltip>
      ) : (
        button
      )}

      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox">
          {getAllModels().map((model) => {
            const ModelIcon = model.icon;
            const menuItem = (
              <button
                key={model.id}
                className={styles.dropdownItem}
                onClick={() => handleItemClick(model.id)}
                role="option"
                aria-selected={model.id === modelConfig.id}
              >
                <div className={styles.menuItemContent}>
                  <ModelIcon />
                  <div className={styles.textContent}>
                    <span>{model.name}</span>
                    {model.description && (
                      <span className={styles.menuItemDescription}>
                        {model.description}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );

            return menuItem;
          })}
        </div>
      )}
    </div>
  );
};
