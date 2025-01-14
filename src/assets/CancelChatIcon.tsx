import React, { useMemo } from 'react';

interface CancelChatIconProps {
  color: string;
}

export const CancelChatIcon: React.FC<CancelChatIconProps> = React.memo(
  ({ color }) => {
    const fillStyle = useMemo(() => ({ fill: color }), [color]);

    return (
      <svg
        style={fillStyle}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 6 6 L 6 26 L 26 26 L 26 6 L 6 6 z" />
      </svg>
    );
  },
);
