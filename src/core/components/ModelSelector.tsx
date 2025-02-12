import ModelDropdownButton from './ModelDropdownButton';
import ModelDropdownExpanded from './ModelDropdownExpanded';
import { useEffect, useState } from 'react';

const ModelSelector = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Handle closing dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector(`#model-selector`);
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
    <div id="model-selector">
      <ModelDropdownButton
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
      />
      {dropdownOpen && (
        <ModelDropdownExpanded setDropdownOpen={setDropdownOpen} />
      )}
    </div>
  );
};

export default ModelSelector;
