import ModelDropdownButton from './ModelDropdownButton';
import ModelDropdownExpanded from './ModelDropdownExpanded';
import { useEffect, useState } from 'react';
import styles from './NavBar.module.css';
import { useIsMobile } from '../../shared/theme/useIsMobile';

const ModelSelector = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isMobile = useIsMobile();

  // Handle closing dropdown when clicking outside
  useEffect(() => {
    if (isMobile) {
      return;
    }
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
  }, [dropdownOpen, isMobile]);

  return (
    <>
      <ModelDropdownButton
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
      />
      {dropdownOpen && (
        <ModelDropdownExpanded setDropdownOpen={setDropdownOpen} />
      )}
    </>
  );
};

export default ModelSelector;
