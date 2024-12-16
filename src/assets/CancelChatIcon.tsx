import { memo } from 'react';

export const CancelChatIcon = memo(() => {
  return (
    <svg
      fill="#000000"
      viewBox="0 0 256 256"
      id="Flat"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M128,24A104,104,0,1,0,232,128,104.11791,104.11791,0,0,0,128,24Zm32,128a8.00008,8.00008,0,0,1-8,8H104a8.00008,8.00008,0,0,1-8-8V104a8.00008,8.00008,0,0,1,8-8h48a8.00008,8.00008,0,0,1,8,8Z" />
    </svg>
  );
}, () => true);
