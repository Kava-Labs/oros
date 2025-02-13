import { SquarePen } from 'lucide-react';
import ButtonIcon from '../components/ButtonIcon';
import styles from './Button.module.css';

interface NewChatButtonProps {
  className?: string;
  onClick(): void;
}

export const NewChatButton = ({ className, onClick }: NewChatButtonProps) => {
  return (
    <ButtonIcon
      icon={SquarePen}
      className={`${styles.chatButton} ${className || ''}`}
      tooltip={{
        text: 'New Chat',
        position: 'bottom',
      }}
      aria-label="New Chat"
      onClick={onClick}
    />
  );
};
