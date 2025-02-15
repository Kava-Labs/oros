import { TextSearch } from 'lucide-react';
import ButtonIcon from '../components/ButtonIcon';
import styles from './Button.module.css';
import type { ButtonIconProps } from '../components/ButtonIcon';

// Only need to specify props specific to SearchChatButton
// Omit the required props from ButtonIcon that we're providing
type SearchHistoryButtonProps = Omit<ButtonIconProps, 'icon' | 'aria-label'>;

export const SearchHistoryButton = ({
  className,
  ...buttonProps
}: SearchHistoryButtonProps) => {
  return (
    <ButtonIcon
      icon={TextSearch}
      className={`${styles.chatButton} ${className || ''}`}
      tooltip={{
        text: 'Search History',
        position: 'bottom',
      }}
      aria-label="Search History"
      {...buttonProps}
    />
  );
};
