import { SquarePen } from 'lucide-react';
import ButtonIcon from '../components/ButtonIcon';
import styles from './Button.module.css';
import type { ButtonIconProps } from '../components/ButtonIcon';

type NewChatButtonProps = Omit<ButtonIconProps, 'icon' | 'aria-label'>;

export const NewChatButton = ({
  className,
  ...buttonProps
}: NewChatButtonProps) => {
  return (
    <ButtonIcon
      icon={SquarePen}
      className={`${styles.chatButton} ${className || ''}`}
      tooltip={{
        text: 'New Chat',
        position: 'bottom',
      }}
      aria-label="New Chat"
      {...buttonProps}
    />
  );
};
