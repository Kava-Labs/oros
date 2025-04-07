import styles from './ModelSelector.module.css';
import { useEffect, useState } from 'react';
import { getAllModels } from '../config';
import { ModelConfig, SupportedModels } from '../types/models';
import type { MessageHistoryStore } from '../stores/messageHistoryStore';

export const ModelSelector = ({
  modelConfig,
  messageHistoryStore,
  handleModelChange,
}: {
  handleModelChange: (modelName: SupportedModels) => void;
  modelConfig: ModelConfig;
  messageHistoryStore: MessageHistoryStore;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0); // For keyboard navigation

  const SelectedModelIcon = modelConfig.icon;
  const models = getAllModels();

  // Check for existing messages to determine disabled state
  const messages = messageHistoryStore.getSnapshot();
  const hasUserMessages = messages.length > 1;

  console.log(hasUserMessages, messages)
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

  // Handle model selection
  const handleItemClick = (modelId: SupportedModels) => {
    handleModelChange(modelId);
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    event.preventDefault();
    let newIndex = highlightedIndex;

    switch (event.key) {
      case 'ArrowDown':
        newIndex = (highlightedIndex + 1) % models.length;
        break;
      case 'ArrowUp':
        newIndex = (highlightedIndex - 1 + models.length) % models.length;
        break;
      case 'Enter':
      case ' ':
        handleItemClick(models[highlightedIndex].id);
        setIsOpen(false);
        return;
      case 'Escape':
        setIsOpen(false);
        return;
      default:
        return;
    }

    setHighlightedIndex(newIndex);

    // Move focus to the new highlighted item
    document.getElementById(`model-${newIndex}`)?.focus();
  };

  return (
    <div className={styles.dropdownContainer}>
      <button
        className={styles.dropdownButton}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select Model"
        role="combobox"
        onKeyDown={handleKeyDown}
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

      {isOpen && (
        <div
          className={styles.dropdownMenu}
          role="listbox"
          aria-activedescendant={`model-${highlightedIndex}`}
          onKeyDown={handleKeyDown}
        >
          {models.map((model, index) => {
            const ModelIcon = model.icon;
            return (
              <div
                key={model.id}
                id={`model-${index}`}
                className={`${styles.dropdownItem} ${index === highlightedIndex ? styles.highlighted : ''}`}
                onClick={() => handleItemClick(model.id)}
                onKeyDown={(event) =>
                  event.key === 'Enter' && handleItemClick(model.id)
                }
                role="option"
                aria-selected={index === highlightedIndex ? 'true' : 'false'}
                aria-label={model.name}
                tabIndex={-1} // the selected one gets focus first
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
