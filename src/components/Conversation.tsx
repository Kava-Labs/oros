import styles from './ChatView.module.css';
import { Content } from './Content';
import { StreamingText } from './StreamingText';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { memo } from 'react';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/useAppContext';
import { ToolCallProgressCards } from './ToolCallProgressCards';
import { CompleteTxDisplay } from './CompleteTxDisplay';
import {
  chainNameToolCallParam,
  chainRegistry,
} from '../config/chainsRegistry';

export interface ConversationProps {
  messages: ChatCompletionMessageParam[];
  onRendered(): void;
}

const StreamingTextContent = (message: string, onRendered: () => void) => {
  return <Content role="assistant" content={message} onRendered={onRendered} />;
};

const ConversationComponent = ({ messages, onRendered }: ConversationProps) => {
  const { logo } = useTheme();
  const { errorText, isRequesting, progressStore, messageStore, registry } =
    useAppContext();

  return (
    <div id={styles.conversation} data-testid="conversation">
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
            <div key={index} className={styles.left}>
              <img src={logo} className={styles.conversationChatIcon} />
              <div className={styles.assistantContainer}>
                <Content
                  role={message.role}
                  content={message.content as string}
                />
              </div>
            </div>
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
            const hash = message.content as string;

            return <CompleteTxDisplay key={index} hash={hash} chain={chain} />;
          }

          return null;
        }
        return null;
      })}
      {isRequesting && (
        <div className={styles.left}>
          <img src={logo} className={styles.conversationChatIcon} />

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
          <img src={logo} className={styles.conversationChatIcon} />
          <div className={styles.assistantContainer}>
            <Content
              content={errorText}
              onRendered={onRendered}
              role="assistant"
            />
          </div>
        </div>
      )}

      <ToolCallProgressCards />
    </div>
  );
};

export const Conversation = memo(ConversationComponent);
