import React, { useMemo } from 'react';

interface SendChatIconProps {
  color: string;
}

export const SendChatIcon: React.FC<SendChatIconProps> = ({ color }) => {
  const strokeStyle = useMemo(() => `${color}`, [color]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      color="transparent"
      fill="none"
    >
      <path
        d="M12 4V20"
        stroke={strokeStyle}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12H20"
        stroke={strokeStyle}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
