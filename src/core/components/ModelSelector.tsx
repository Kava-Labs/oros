import ModelDropdownButton from './ModelDropdownButton';
import ModelDropdownExpanded from './ModelDropdownExpanded';
import { useEffect, useRef, useState } from 'react';

const ModelSelector = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Handle closing dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
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
    <div ref={selectorRef}>
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
