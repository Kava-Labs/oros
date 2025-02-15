import { SquarePen } from 'lucide-react';
import ButtonIcon from '../components/ButtonIcon';
import type { ButtonIconProps } from '../components/ButtonIcon';

type NewChatButtonProps = Omit<ButtonIconProps, 'icon' | 'aria-label'>;

export const NewChatButton = ({
  className,
  ...buttonProps
}: NewChatButtonProps) => {
  return (
    <ButtonIcon
      icon={SquarePen}
      className={`${className || ''}`}
      tooltip={{
        text: 'New Chat',
        position: 'bottom',
      }}
      aria-label="New Chat"
      {...buttonProps}
    />
  );
};
