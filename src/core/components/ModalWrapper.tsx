import styles from './SearchChatHistory.module.css';
import { X } from 'lucide-react';
import { ReactNode, RefObject, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalWrapperProps {
  children: ReactNode;
  modalRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  closeOnOutsideClick?: boolean;
  isOpen: boolean;
}

const ModalWrapper = ({
  children,
  modalRef,
  onClose,
  closeOnOutsideClick = true,
  isOpen,
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

  if (!isOpen) return null;

  return ReactDOM.createPortal(
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
    </div>,
    document.body,
  );
};

export default ModalWrapper;
