import { memo } from 'react';

export const CancelChatIcon = memo(
  () => {
    return (
      <svg
        fill="#ff564f"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 6 6 L 6 26 L 26 26 L 26 6 L 6 6 z" />
      </svg>
    );
  },
  () => true,
);
