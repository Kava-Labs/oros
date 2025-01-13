// import { memo } from 'react';

// export const SendChatIcon = memo(
//   () => {
//     return (
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         viewBox="0 0 24 24"
//         color="transparent"
//         fill="none"
//       >
//         <path
//           d="M12 4V20"
//           stroke="rgb(247, 73, 40, 0.75)"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         />
//         <path
//           d="M4 12H20"
//           stroke="rgb(247, 73, 40, 0.75)"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         />
//       </svg>
//     );
//   },
//   () => true,
// );

interface SendChatIconProps {
  color: string;
}

export const SendChatIcon = ({ color }: SendChatIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      color="transparent"
      fill="none"
    >
      <path
        d="M12 4V20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12H20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
