import { SVGProps } from 'react';
import styles from '../components/ChatHistory.module.css';

const NewChatIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="20"
      height="21"
      viewBox="0 0 20 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.newChatIcon} // Add this class
      {...props}
    >
      <path
        d="M2 21C1.45 21 0.979167 20.8041 0.5875 20.4125C0.195833 20.0208 0 19.55 0 19V4.99998C0 4.44998 0.195833 3.97914 0.5875 3.58748C0.979167 3.19581 1.45 2.99998 2 2.99998H10.925L8.925 4.99998H2V19H16V12.05L18 10.05V19C18 19.55 17.8042 20.0208 17.4125 20.4125C17.0208 20.8041 16.55 21 16 21H2ZM6 15V10.75L15.175 1.57498C15.375 1.37498 15.6 1.22498 15.85 1.12498C16.1 1.02498 16.35 0.974976 16.6 0.974976C16.8667 0.974976 17.1208 1.02498 17.3625 1.12498C17.6042 1.22498 17.825 1.37498 18.025 1.57498L19.425 2.99998C19.6083 3.19998 19.75 3.42081 19.85 3.66248C19.95 3.90414 20 4.14998 20 4.39998C20 4.64998 19.9542 4.89581 19.8625 5.13748C19.7708 5.37914 19.625 5.59998 19.425 5.79998L10.25 15H6ZM8 13H9.4L15.2 7.19998L14.5 6.49998L13.775 5.79998L8 11.575V13Z"
        fill="currentColor" // Change this from #B4B4B4 to currentColor
      />
    </svg>
  );
};

export default NewChatIcon;
