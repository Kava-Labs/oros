import ButtonIcon, { ButtonIconProps } from '../components/ButtonIcon';
import { X } from 'lucide-react';
import styles from './Button.module.css';

type CloseIconProps = Omit<ButtonIconProps, 'icon' | 'aria-label'>;

export const CloseIcon = ({ className, ...buttonProps }: CloseIconProps) => {
  return (
    <ButtonIcon
      icon={X}
      className={`${styles.chatButton} ${className || ''}`}
      aria-label="Close"
      {...buttonProps}
    />
  );
};

export default CloseIcon;
