import styles from './NavBar.module.css';
import KavaAILogo from '../assets/KavaAILogo';
import HamburgerIcon from '../assets/HamburgerIcon';
import { isInIframe } from '../utils/isInIframe';
import ModelSelector from './ModelSelector';
import { useIsMobile } from '../../shared/theme/useIsMobile';
import NewChatIcon from '../assets/NewChatIcon';
import { useAppContext } from '../context/useAppContext';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;

interface NavBarProps {
  chatHistoryOpen: boolean;
  setChatHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavBar = ({ chatHistoryOpen, setChatHistoryOpen }: NavBarProps) => {
  const showNavBar = !isInIframe() && FEAT_UPDATED_DESIGN;
  const { messageHistoryStore } = useAppContext();
  const isMobile = useIsMobile();

  if (!showNavBar) return null;

  return (
    <div className={styles.container}>
      <nav className={styles.nav} role="navigation">
        <div className={styles.menu}>
          <div
            className={styles.hamburger}
            onClick={() => {
              setChatHistoryOpen((prev) => !prev);
            }}
          >
            <HamburgerIcon />
          </div>
          <div className={styles.logo}>
            <KavaAILogo />
          </div>
          {isMobile && (
            <button
              onClick={() => messageHistoryStore.reset()}
              data-testid="new-chat-button"
              className={styles.newChatIcon}
            >
              <NewChatIcon />
            </button>
          )}
        </div>
        {!chatHistoryOpen && (
          <div className={styles.dropdownContainer}>
            <ModelSelector />
          </div>
        )}
      </nav>
    </div>
  );
};

export default NavBar;
