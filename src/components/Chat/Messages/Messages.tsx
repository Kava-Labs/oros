import { StaticMessage } from '../StaticMessage';
import styles from '../style.module.css';
import type { GenerateTokenMetadataResponse } from '../../../tools/toolFunctions';
import { GeneratedToken } from '../GeneratedToken';
import { LoadingSpinner } from '../../LoadingSpinner';
import { useHasTokenGenerationInProgress } from '../../../stores';
import type { ChatCompletionMessageParam } from 'openai/resources/index';

export const INTRO_MESSAGE = `Hey I'm Kava AI. You can ask me any question. If you're here for the #KavaAI Launch Competition, try asking a question like "I want to deploy a memecoin on Kava with cool tokenomics".`;

export const Messages = ({
  history,
}: {
  history: ChatCompletionMessageParam[];
}) => {
  const isGeneratingToken = useHasTokenGenerationInProgress();

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
          if (tc.function.name !== 'generateCoinMetadata') return null;

          const toolResponse: GenerateTokenMetadataResponse = JSON.parse(
            msg.content as string,
          );

          return (
            <GeneratedToken
              key={i}
              id={toolResponse.id}
              about={toolResponse.about}
              symbol={toolResponse.symbol}
              name={toolResponse.name}
            />
          );
        }

        return null;
      })}

      {isGeneratingToken ? (
        <div className={styles.chatBubbleAssistant}>
          <div data-chat-role="tool" className={styles.chatBubble}>
            <h3 className={styles.title}>Generating Token Metadata</h3>
            <div style={{ paddingLeft: '30%' }}>
              <LoadingSpinner />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
