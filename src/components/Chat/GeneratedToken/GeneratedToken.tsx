import { useEffect, useState } from 'react';
import styles from '../style.module.css';
import { getImage } from '../../../utils/idb/idb';
import { toast } from 'react-toastify';
import type { GenerateTokenMetadataResponse } from '../../../tools/toolFunctions';

export const GeneratedToken = (props: GenerateTokenMetadataResponse) => {
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
        <h3>Name: {props.name}</h3>
        <h3>Symbol: {props.symbol}</h3>
        <h3>Description</h3>
        <p>{props.about}</p>
        <h3>Token Image</h3>
        <img
          alt="Model Generated Image"
          src={`data:image/png;base64,${imgData}`}
        />

        {window.self !== window.top ? (
          <button
            className={styles.submitButton}
            onClick={() => {
              const isInsideIFrame = window.self !== window.top;
              if (isInsideIFrame) {
                console.log('sending message to parent');
                window.parent.postMessage(
                  {
                    type: 'GENERATED_TOKEN_METADATA',
                    payload: {
                      base64ImageData: imgData,
                      tokenName: props.name,
                      tokenSymbol: props.symbol,
                      tokenDescription: props.about,
                    },
                  },
                  '*', // target origin is * for now (wherever we are embedded) later we want to restrict this to only work with hard.fun
                );
              }
            }}
          >
            launch
          </button>
        ) : null}
      </div>
    </div>
  );
};
