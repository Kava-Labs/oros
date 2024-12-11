import { useEffect, useState } from 'react';
import styles from '../style.module.css';
import { getImage } from '../../../utils/idb/idb';

export const ChatImage = (props: { id: string }) => {
  const { id } = props;
  const [imgData, setImageData] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }

    getImage(id)
      .then((res) => {
        if (res) {
          setImageData(res.data);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [id]);

  return (
    <div className={styles.chatBubbleAssistant}>
      <div data-chat-role="tool" className={styles.chatBubble}>
        <img
          alt="Model Generated Image"
          src={`data:image/png;base64,${imgData}`}
        />
      </div>
    </div>
  );
};
