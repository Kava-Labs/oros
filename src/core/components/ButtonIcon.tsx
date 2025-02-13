// ButtonIcon.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './ButtonIcon.module.css';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
type ButtonIconClickHandler = (
  event: React.MouseEvent<HTMLButtonElement>,
) => void;

interface TooltipProps {
  text: string;
  position?: TooltipPosition;
  delay?: number;
}

interface ButtonIconProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  tooltip?: TooltipProps | string;
  size?: number;
  'aria-label': string;
  onClick?: ButtonIconClickHandler;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function isTooltipProps(
  tooltip: TooltipProps | string | undefined,
): tooltip is TooltipProps {
  return typeof tooltip === 'object' && tooltip !== null;
}

const ButtonIcon = ({
  icon: Icon,
  tooltip,
  onClick,
  className = '',
  size = 22,
  disabled = false,
  'aria-label': ariaLabel,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonIconProps) => {
  const tooltipText = isTooltipProps(tooltip) ? tooltip.text : tooltip;
  const tooltipPosition = isTooltipProps(tooltip)
    ? tooltip.position || 'top'
    : 'top';
  const tooltipDelay = isTooltipProps(tooltip) ? tooltip.delay : undefined;

  const tooltipStyle = tooltipDelay
    ? { transitionDelay: `${tooltipDelay}ms` }
    : undefined;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${styles.button} ${disabled ? styles.disabled : ''} ${className}`}
      {...rest}
    >
      <Icon size={size} />
      {tooltipText && (
        <div
          className={`${styles.tooltip} ${styles[`tooltip${tooltipPosition.charAt(0).toUpperCase()}${tooltipPosition.slice(1)}`]}`}
          style={tooltipStyle}
        >
          {tooltipText}
        </div>
      )}
    </button>
  );
};

export default ButtonIcon;
