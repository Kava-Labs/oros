import { TextSearch } from 'lucide-react';
import ButtonIcon from '../components/ButtonIcon';
import styles from './Button.module.css';

interface SearchChatButtonProps {
  className?: string;
  onClick(): void;
}

export const SearchChatButton = ({
  className,
  onClick,
}: SearchChatButtonProps) => {
  return (
    <ButtonIcon
      icon={TextSearch}
      className={`${styles.chatButton} ${className || ''}`}
      tooltip={{
        text: 'Search History',
        position: 'bottom',
      }}
      aria-label="Search History"
      onClick={onClick}
    />
  );
};
