import { useSelector } from 'react-redux';
import {
  selectHasImageGenerationInProgress,
  selectMessageHistory,
} from '../../../stores';
import { StaticMessage } from '../StaticMessage';
import styles from '../style.module.css';
import { useEffect, useState } from 'react';
import { getImage } from '../../../utils/idbd/idbd';
import { GenerateImageResponse } from '../../../utils/image/image';

export const INTRO_MESSAGE = `Hey I'm Kava AI. You can ask me any question. If you're here for the #KavaAI Launch Competition, try asking a question like "I want to deploy a memecoin on Kava with cool tokenomics".`;

export const Messages = () => {
  const history = useSelector(selectMessageHistory);
  const isGeneratingImage = useSelector(selectHasImageGenerationInProgress);

  return (
    <>
      <StaticMessage role="assistant" content={INTRO_MESSAGE} />
      {history.map((msg, i) => {
        if (msg.role === 'system') {
          return null;
        }

        if (msg.role === 'assistant' || msg.role === 'user') {
          return (
            <StaticMessage
              key={i}
              role={msg.role}
              content={msg.content as string}
            />
          );
        }

        if (msg.role === 'tool') {
          // if this message is the results of a generateImage tool call
          // render out the image
          const id = msg.tool_call_id;
          const prevMsg = history[i - 1];

          if (
            !(
              prevMsg.role === 'assistant' &&
              prevMsg.content === null &&
              Array.isArray(prevMsg.tool_calls)
            )
          ) {
            return null;
          }

          const tc = prevMsg.tool_calls.find((tc) => tc.id === id);
          if (!tc) return null;
          if (tc.function.name !== 'generateImage') return null;

          const toolResponse: GenerateImageResponse = JSON.parse(
            msg.content as string,
          );

          return <ChatImage key={i} id={toolResponse.id} />;
        }

        return null;
      })}

      {isGeneratingImage ? (
        <div className={styles.chatBubbleAssistant}>
          <div data-chat-role="tool" className={styles.chatBubble}>
            <div className={styles.imagePlaceholder}>
              <p style={{ textAlign: 'center' }}>generating Image...</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

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
        <img src={`data:image/png;base64,${imgData}`} />
      </div>
    </div>
  );
};
