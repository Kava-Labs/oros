import styles from './NavBar.module.css';
import { getAllModels, isBlockchainModelName } from '../config/models';
import { ModelConfig } from '../types/models';
import { useAppContext } from '../context/useAppContext';
import { useIsMobile } from '../../shared/theme/useIsMobile';

interface ModelDropdownProps {
  setDropdownOpen: (dropdownOpen: boolean) => void;
}

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

        //  since we don't support metamask on mobile, don't allow a user to switch to blockchain models
        const disableOption = isMobile && isBlockchainModelName(model.id);

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
