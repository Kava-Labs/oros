import { TextSearch } from 'lucide-react';
import ButtonIcon from '../components/ButtonIcon';
import type { ButtonIconProps } from '../components/ButtonIcon';

// Only need to specify props specific to SearchChatButton
// Omit the required props from ButtonIcon that we're providing
type SearchChatButtonProps = Omit<ButtonIconProps, 'icon' | 'aria-label'>;

export const SearchChatButton = ({
  className,
  ...buttonProps
}: SearchChatButtonProps) => {
  return (
    <ButtonIcon
      icon={TextSearch}
      className={`${className || ''}`}
      tooltip={{
        text: 'Search History',
        position: 'bottom',
      }}
      aria-label="Search History"
      {...buttonProps}
    />
  );
};
