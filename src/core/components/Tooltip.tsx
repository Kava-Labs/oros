import React, { useState, useRef, useEffect } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  topMargin: string;
}

const Tooltip = ({ content, children, topMargin }: TooltipProps) => {
  const [show, setShow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && tooltipRef.current && targetRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      const left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;

      tooltipRef.current.style.top = `${topMargin}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  }, [show, topMargin]);

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      ref={targetRef}
    >
      {children}
      {show && (
        <div ref={tooltipRef} className={styles.tooltip} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
