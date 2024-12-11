import { useEffect, useState } from 'react';
import styles from '../style.module.css';
import { getImage } from '../../../utils/idb/idb';
import { toast } from 'react-toastify';

export const ChatImage = (props: { id: string }) => {
  const { id } = props;
  if (!id) {
    return null;
  }

  const [imgData, setImageData] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }
    getImage(id)
      .then((res) => {
        if (res) {
          setImageData(res.data);
        } else {
          toast.dismiss();
          toast.error(
            'Error: failed to load requested image from browser storage, this could be because you have cleared your storage',
          );
        }
      })
      .catch((err) => {
        toast.dismiss();
        toast.error(
          `Error: failed to load requested image ${err instanceof Error ? err.message : ''}`,
        );
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
