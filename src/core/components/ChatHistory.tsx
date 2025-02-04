import styles from './ChatHistory.module.css';

export const ChatHistory = () => {
  const chatHistories = [
    { title: 'Mock Chat History Number one', conversation: [] },
    { title: 'Mock Chat History Number two', conversation: [] },
  ];

  return (
    <div className={styles.chatHistoryContainer}>
      <button
        className={styles.newChatButton}
        data-testid="new-chat-container-button"
      >
        <svg
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 21C1.45 21 0.979167 20.8042 0.5875 20.4125C0.195833 20.0208 0 19.55 0 19V5.00001C0 4.45001 0.195833 3.97917 0.5875 3.58751C0.979167 3.19584 1.45 3.00001 2 3.00001H10.925L8.925 5.00001H2V19H16V12.05L18 10.05V19C18 19.55 17.8042 20.0208 17.4125 20.4125C17.0208 20.8042 16.55 21 16 21H2ZM6 15V10.75L15.175 1.57501C15.375 1.37501 15.6 1.22501 15.85 1.12501C16.1 1.02501 16.35 0.975006 16.6 0.975006C16.8667 0.975006 17.1208 1.02501 17.3625 1.12501C17.6042 1.22501 17.825 1.37501 18.025 1.57501L19.425 3.00001C19.6083 3.20001 19.75 3.42084 19.85 3.66251C19.95 3.90417 20 4.15001 20 4.40001C20 4.65001 19.9542 4.89584 19.8625 5.13751C19.7708 5.37917 19.625 5.60001 19.425 5.80001L10.25 15H6ZM8 13H9.4L15.2 7.20001L14.5 6.50001L13.775 5.80001L8 11.575V13Z"
            fill="#B4B4B4"
          />
        </svg>
        <p className={styles.newChatButtonText}>New Chat</p>
      </button>

      {/*  */}
      <div className={styles.historySection} data-testid="chat-history-section">
        <h5 className={styles.historySectionTitle}>History</h5>

        <div>
          {chatHistories.map(({ title }, index) => {
            return (
              <div
                key={index}
                className={styles.chatHistoryItem}
              >
                <p>{title}</p>
                <div>
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.54166 16.625C5.10624 16.625 4.7335 16.47 4.42343 16.1599C4.11336 15.8498 3.95832 15.4771 3.95832 15.0417V4.75H3.16666V3.16667H7.12499V2.375H11.875V3.16667H15.8333V4.75H15.0417V15.0417C15.0417 15.4771 14.8866 15.8498 14.5766 16.1599C14.2665 16.47 13.8937 16.625 13.4583 16.625H5.54166ZM13.4583 4.75H5.54166V15.0417H13.4583V4.75ZM7.12499 13.4583H8.70832V6.33333H7.12499V13.4583ZM10.2917 13.4583H11.875V6.33333H10.2917V13.4583Z"
                      fill="#B4B4B4"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
