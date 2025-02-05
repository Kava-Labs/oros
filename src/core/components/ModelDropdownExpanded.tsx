import styles from './NavBar.module.css';
import { getAllModels } from '../config/models';
import { ModelConfig } from '../types/models';
import { useAppContext } from '../context/useAppContext';

interface ModelDropdownProps {
  setDropdownOpen: (dropdownOpen: boolean) => void;
}

import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState<boolean>(
    window.matchMedia(query).matches,
  );

  useEffect(() => {
    const matchQuery = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    matchQuery.addEventListener('change', onChange);
    return () => matchQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

export const useIsMobile = () => useMediaQuery('(max-width: 768px)');

const ModelDropdownExpanded = ({ setDropdownOpen }: ModelDropdownProps) => {
  const { handleModelChange } = useAppContext();

  const isMobile = useIsMobile();

  const handleModelClick = (model: ModelConfig) => {
    handleModelChange(model.id);
    setDropdownOpen(false);
  };
  return (
    <div className={styles.dropdownMenu} data-testid="model-dropdown-menu">
      {getAllModels().map((model) => {
        const ModelOptionIcon = model.icon;

        const disableOption = isMobile && model.id !== 'deepseek-chat';

        return (
          <button
            key={model.name}
            className={styles.dropdownItem}
            onClick={() => handleModelClick(model)}
            role="option"
            disabled={disableOption}
          >
            <ModelOptionIcon />
            <span>{model.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModelDropdownExpanded;
