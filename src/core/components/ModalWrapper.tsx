import styles from './SearchChatHistory.module.css';
import { X } from 'lucide-react';
import { ReactNode, RefObject, useEffect } from 'react';

interface ModalWrapperProps {
  children: ReactNode;
  modalRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  closeOnOutsideClick?: boolean;
}

const ModalWrapper = ({
  children,
  modalRef,
  onClose,
  closeOnOutsideClick = true,
}: ModalWrapperProps) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        closeOnOutsideClick &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnOutsideClick, onClose, modalRef]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>
        <button
          onClick={onClose}
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
