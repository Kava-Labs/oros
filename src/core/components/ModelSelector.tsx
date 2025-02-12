import ModelDropdownButton from './ModelDropdownButton';
import ModelDropdownExpanded from './ModelDropdownExpanded';
import { useEffect, useState } from 'react';
import styles from './NavBar.module.css';

const ModelSelector = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
