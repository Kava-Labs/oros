import styles from './NavBar.module.css';
import { getAllModels } from '../config/models';
import { ModelConfig } from '../types/models';
import { useAppContext } from '../context/useAppContext';

interface ModelDropdownProps {
  setDropdownOpen: (dropdownOpen: boolean) => void;
}

const ModelDropdownExpanded = ({ setDropdownOpen }: ModelDropdownProps) => {
  const { handleModelChange } = useAppContext();

  const handleModelClick = (model: ModelConfig) => {
    handleModelChange(model.id);
    setDropdownOpen(false);
  };
  return (
    <div className={styles.dropdownMenu} data-testid="model-dropdown-menu">
      {getAllModels().map((model) => {
        const ModelOptionIcon = model.icon;

        return (
          <button
            key={model.name}
            className={styles.dropdownItem}
            onClick={() => handleModelClick(model)}
            role="option"
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
