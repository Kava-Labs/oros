// Use React Portal to render the modal at the root level
import ReactDOM from 'react-dom';

interface Props {
  isOpen: boolean;
}

const SearchModal = ({ isOpen }: Props) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modalOverlay">
      <div className="modal">{/* Modal content */}</div>
    </div>,
    document.body,
  );
};

export default SearchModal;
