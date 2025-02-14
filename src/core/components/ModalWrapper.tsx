import styles from './SearchChatHistory.module.css';
import { X } from 'lucide-react';
import { ReactNode, RefObject } from 'react';

interface ModalWrapperProps {
  children: ReactNode;
  modalRef: RefObject<HTMLDivElement | null>;
  onCloseClick: () => void;
}

const ModalWrapper = ({
  children,
  modalRef,
  onCloseClick,
}: ModalWrapperProps) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>
        <button
          onClick={onCloseClick}
          className={`${styles.iconButton} ${styles.closeButton}`}
          aria-label="Close search"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default ModalWrapper;
