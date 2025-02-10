import styles from './ChatView.module.css';
import { Content } from './Content';
import { StreamingText } from './StreamingText';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { memo, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { ToolCallProgressCards } from './ToolCallProgressCards';
import {
  CompleteTxDisplay,
  CompleteQueryDisplay,
} from '../../features/blockchain/components/displayCards';
import {
  chainNameToolCallParam,
  chainRegistry,
} from '../../features/blockchain/config/chainsRegistry';
import {
  OperationResult,
  OperationType,
} from '../../features/blockchain/types/chain';
import KavaIcon from '../assets/KavaIcon';
import { isInIframe } from '../utils/isInIframe';
import { Copy, ClipboardCheck } from 'lucide-react';
import { useIsMobile } from '../../shared/theme/useIsMobile';

export interface ConversationProps {
  messages: ChatCompletionMessageParam[];
  onRendered(): void;
}

const StreamingTextContent = (message: string, onRendered: () => void) => {
  return <Content role="assistant" content={message} onRendered={onRendered} />;
};

const ConversationComponent = ({ messages, onRendered }: ConversationProps) => {
  const { errorText, isRequesting, progressStore, messageStore, registry } =
    useAppContext();

  return (
    <div
      id={styles.conversation}
      data-testid="conversation"
      style={{ marginTop: !isInIframe() ? '24px' : '-10px' }}
    >
      {messages.map((message, index) => {
        if (message.role === 'user') {
          return (
            <div key={index} className={styles.right}>
              <Content
                role={message.role}
                content={message.content as string}
              />
            </div>
          );
        }

        if (message.role === 'assistant' && message.content) {
          return (
            <AssistantMessage key={index} content={message.content as string} />
          );
        }

        if (message.role === 'tool') {
          const id = message.tool_call_id;
          const prevMsg = messages[index - 1];
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

          const params = JSON.parse(tc.function.arguments);
          if (
            typeof params === 'object' &&
            params !== null &&
            chainNameToolCallParam.name in params
          ) {
            const chainName = params[chainNameToolCallParam.name];
            const operation = registry.get(tc.function.name);
            if (!operation) return null;

            const chain = chainRegistry[operation.chainType][chainName];
            const content: OperationResult = JSON.parse(
              message.content as string,
            );
            if (content.status !== 'ok') {
              return null;
            }

            if (operation.operationType === OperationType.QUERY) {
              return (
                <CompleteQueryDisplay
                  key={index}
                  content={content.info}
                  onRendered={onRendered}
                />
              );
            } else {
              return (
                <CompleteTxDisplay
                  key={index}
                  hash={content.info}
                  chain={chain}
                />
              );
            }
          }

          return null;
        }
        return null;
      })}
      {isRequesting && (
        <div className={styles.left}>
          <KavaIcon className={styles.conversationChatIcon} />

          <div className={styles.assistantContainer}>
            <div id={styles.progressStream}>
              <StreamingText store={progressStore} onRendered={onRendered}>
                {StreamingTextContent}
              </StreamingText>
            </div>
            <div id={styles.assistantStream}>
              <StreamingText store={messageStore} onRendered={onRendered}>
                {StreamingTextContent}
              </StreamingText>
            </div>
          </div>
        </div>
      )}
      {errorText.length > 0 && (
        <div className={styles.left}>
          <KavaIcon className={styles.conversationChatIcon} />
          <div className={styles.assistantContainer}>
            <Content
              content={errorText}
              onRendered={onRendered}
              role="assistant"
            />
          </div>
        </div>
      )}

      <ToolCallProgressCards onRendered={onRendered} />
    </div>
  );
};

const AssistantMessage = ({ content }: { content: string }) => {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    let id: NodeJS.Timeout;

    if (copied) {
      id = setTimeout(() => {
        setCopied(false);
      }, 1000);
    }

    return () => {
      if (id) {
        clearTimeout(id);
      }
    };
  }, [copied]);

  const copyIcon = useMemo(
    () =>
      !copied ? (
        <Copy
          width="20px"
          cursor="pointer"
          onClick={() => {
            try {
              window.navigator.clipboard.writeText(content);
              setCopied(true);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      ) : (
        <ClipboardCheck
          width="20px"
          cursor="pointer"
          onClick={() => setCopied(false)}
        />
      ),
    [content, copied],
  );

  return (
    <div
      className={styles.left}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <KavaIcon className={styles.conversationChatIcon} />
      <div className={styles.assistantContainer}>
        <Content role="assistant" content={content} />
        <div className={styles.copyIconContainer}>
          {isMobile ? copyIcon : hover ? copyIcon : null}
        </div>
      </div>
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
