import styles from './SearchChatHistory.module.css';
import { X } from 'lucide-react';
import { ReactNode, RefObject, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ButtonIcon from './ButtonIcon';

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

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>
        <ButtonIcon
          className={`${styles.iconButton} ${styles.closeButton}`}
          icon={X}
          aria-label="Close search modal"
          onClick={onClose}
        />
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default ModalWrapper;
