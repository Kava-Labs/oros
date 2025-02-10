import styles from './NavBar.module.css';
import { getAllModels, isBlockchainModelName } from '../config/models';
import { ModelConfig } from '../types/models';
import { useAppContext } from '../context/useAppContext';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import Tooltip from './Tooltip';

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

  const displayedModelOptions = getAllModels().map((model) => {
    const ModelOptionIcon = model.icon;
    const disableOption = isMobile && isBlockchainModelName(model.id);

    const modelButton = (
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

    return disableOption ? (
      <Tooltip
        key={model.name}
        content="Blockchain models are not supported on mobile devices"
        topMargin="30"
      >
        {modelButton}
      </Tooltip>
    ) : (
      modelButton
    );
  });

  return (
    <div className={styles.dropdownMenu} data-testid="model-dropdown-menu">
      {displayedModelOptions}
    </div>
  );
};

export default ModelDropdownExpanded;
