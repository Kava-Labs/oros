import {
  useRef,
  useEffect,
  useCallback,
  useSyncExternalStore,
  useState,
} from 'react';
import { ChatView } from './core/components/ChatView';
import {
  isContentChunk,
  isToolCallChunk,
  assembleToolCallsFromStream,
} from './core/utils/streamUtils';
import { TextStreamStore } from './core/stores/textStreamStore';
import { defaultCautionText } from './features/blockchain/config/prompts/defaultPrompts';
import { ToolCallStreamStore } from './core/stores/toolCallStreamStore';
import { MessageHistoryStore } from './core/stores/messageHistoryStore';
import { useAppContext } from './core/context/useAppContext';
import { OperationResult } from './features/blockchain/types/chain';
import { ExecuteOperation } from './core/context/types';
import NavBar from './core/components/NavBar';
import styles from './App.module.css';
import { ChatHistory } from './core/components/ChatHistory';
import { useIsMobile } from './shared/theme/useIsMobile';
import { ModelConfig } from './core/types/models';
import OpenAI from 'openai';
import { isInIframe } from './core/utils/isInIframe';

const FEAT_UPDATED_DESIGN = import.meta.env.VITE_FEAT_UPDATED_DESIGN;
const showHistorySidebar = !isInIframe() && FEAT_UPDATED_DESIGN;

export const App = () => {
  const {
    setErrorText,
    isReady,
    isRequesting,
    setIsRequesting,
    modelConfig,
    executeOperation,
    messageHistoryStore,
    toolCallStreamStore,
    progressStore,
    client,
    messageStore,
    thinkingStore,
  } = useAppContext();

  const messages = useSyncExternalStore(
    messageHistoryStore.subscribe,
    messageHistoryStore.getSnapshot,
  );
  useEffect(() => {
    if (!messageHistoryStore.getSnapshot().length) {
      messageHistoryStore.addMessage({
        role: 'system' as const,
        content: modelConfig.systemPrompt,
      });
    }
  }, [messageHistoryStore, modelConfig.systemPrompt]);

  // abort controller for cancelling openai request
  const controllerRef = useRef<AbortController | null>(null);

  const handleChatCompletion = useCallback(
    async (value: string) => {
      if (isRequesting) {
        return;
      }
      // should not happen
      if (!client) {
        console.error('client usage before ready');
        return;
      }

      toolCallStreamStore.clear();
      // Abort controller integrated with UI
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsRequesting(true);

      // Add the user message to the UI
      messageHistoryStore.addMessage({ role: 'user' as const, content: value });

      // Call chat completions and resolve all tool calls.
      //
      // This is recursive and completes when all tools calls have been made
      // and all follow ups have been completed.
      try {
        //  clear any existing error
        setErrorText('');

        await doChat(
          controller,
          client,
          messageHistoryStore,
          modelConfig,
          progressStore,
          messageStore,
          toolCallStreamStore,
          thinkingStore,
          executeOperation,
        );
      } catch (error) {
        let errorMessage =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : 'An error occurred - please try again';

        //  Errors can be thrown when recursive call is cancelled
        if (errorMessage.includes('JSON')) {
          errorMessage = 'You clicked cancel - please try again';
        }

        setErrorText(errorMessage);
      } finally {
        setIsRequesting(false);
        controllerRef.current = null;
      }
    },
    [
      isRequesting,
      setErrorText,
      setIsRequesting,
      executeOperation,
      modelConfig,
      messageHistoryStore,
      progressStore,
      toolCallStreamStore,
      messageStore,
      client,
      thinkingStore,
    ],
  );

  const handleCancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      toolCallStreamStore.clear();
    }
  }, [toolCallStreamStore]);

  const handleReset = useCallback(() => {
    handleCancel();
    messageHistoryStore.setMessages([
      { role: 'system' as const, content: modelConfig.systemPrompt },
    ]);
  }, [handleCancel, messageHistoryStore, modelConfig.systemPrompt]);

  const isMobile = useIsMobile();
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);

  useEffect(() => {
    // when not on mobile the toggle should always be reset back to false
    if (!isMobile && chatHistoryOpen) {
      setChatHistoryOpen(false);
    }
  }, [chatHistoryOpen, isMobile]);

  return (
    <>
      {isReady && (
        <div className={styles.appContent}>
          <NavBar
            chatHistoryOpen={chatHistoryOpen}
            setChatHistoryOpen={setChatHistoryOpen}
          />
          {showHistorySidebar ? (
            <div className={styles.appContainer}>
              {!isMobile ? (
                <ChatHistory setChatHistoryOpen={setChatHistoryOpen} />
              ) : chatHistoryOpen ? (
                <ChatHistory setChatHistoryOpen={setChatHistoryOpen} />
              ) : null}
              {!chatHistoryOpen ? (
                <ChatView
                  introText={modelConfig.introText}
                  cautionText={defaultCautionText}
                  messages={messages}
                  onSubmit={handleChatCompletion}
                  onReset={handleReset}
                  onCancel={handleCancel}
                />
              ) : null}
            </div>
          ) : (
            <ChatView
              introText={modelConfig.introText}
              cautionText={defaultCautionText}
              messages={messages}
              onSubmit={handleChatCompletion}
              onReset={handleReset}
              onCancel={handleCancel}
            />
          )}
        </div>
      )}
    </>
  );
};

async function doChat(
  controller: AbortController,
  client: OpenAI,
  messageHistoryStore: MessageHistoryStore,
  modelConfig: ModelConfig,
  progressStore: TextStreamStore,
  messageStore: TextStreamStore,
  toolCallStreamStore: ToolCallStreamStore,
  thinkingStore: TextStreamStore,
  executeOperation: ExecuteOperation,
) {
  progressStore.setText('Thinking');
  const { id, tools } = modelConfig;
  try {
    const stream = await client.chat.completions.create(
      {
        model: id,
        messages: messageHistoryStore.getSnapshot().map((msg) => {
          // @ts-expect-error reasoningContent may exist
          if (msg.reasoningContent) {
            // @ts-expect-error delete from msg
            delete msg.reasoningContent;
          }
          return msg;
        }),
        tools: tools,
        stream: true,
      },
      {
        signal: controller.signal,
      },
    );

    let content = '';
    let thinkingEnd = -1;

    for await (const chunk of stream) {
      if (progressStore.getSnapshot() !== '') {
        progressStore.setText('');
      }

      if (isContentChunk(chunk)) {
        content += chunk['choices'][0]['delta']['content'];

        switch (modelConfig.id) {
          case 'deepseek-r1': {
            const openTag = '<think>';
            const closeTag = '</think>';

            if (thinkingEnd === -1) {
              thinkingEnd = content.indexOf(closeTag);
              // stream the thoughts part to the thinking store
              if (content.length >= openTag.length) {
                thinkingStore.setText(
                  content.slice(
                    openTag.length,
                    thinkingEnd === -1 ? content.length : thinkingEnd,
                  ),
                );
              }
            }

            if (thinkingEnd !== -1) {
              // stream the response part to the message store
              messageStore.setText(
                content.slice(thinkingEnd + closeTag.length),
              );
            }
            break;
          }

          default: {
            messageStore.setText(content);
            break;
          }
        }
      } else if (isToolCallChunk(chunk)) {
        assembleToolCallsFromStream(chunk, toolCallStreamStore);
      }
    }

    // Push a message
    if (messageStore.getSnapshot() !== '') {
      const msg = {
        role: 'assistant' as const,
        content: messageStore.getSnapshot(),
      };

      if (thinkingStore.getSnapshot() !== '') {
        // @ts-expect-error setting reasoningContent
        msg.reasoningContent = thinkingStore.getSnapshot();
        thinkingStore.setText('');
      }

      messageHistoryStore.addMessage(msg);

      messageStore.setText('');
    }

    if (toolCallStreamStore.getSnapShot().length > 0) {
      // do the tool calls
      await callTools(
        toolCallStreamStore,
        messageHistoryStore,
        executeOperation,
      );

      // inform the model of the tool call responses
      await doChat(
        controller,
        client,
        messageHistoryStore,
        modelConfig,
        progressStore,
        messageStore,
        toolCallStreamStore,
        thinkingStore,
        executeOperation,
      );
    }
  } catch (e) {
    console.error(`An error occurred: ${e} `);
    throw e;
  } finally {
    // Clear progress text if not cleared already
    if (progressStore.getSnapshot() !== '') {
      progressStore.setText('');
    }

    // Ensure content is published on abort
    if (messageStore.getSnapshot() !== '') {
      messageHistoryStore.addMessage({
        role: 'assistant' as const,
        content: messageStore.getSnapshot(),
      });
      messageStore.setText('');
    }
  }
}

async function callTools(
  toolCallStreamStore: ToolCallStreamStore,
  messageHistoryStore: MessageHistoryStore,
  executeOperation: ExecuteOperation,
): Promise<void> {
  for (const toolCall of toolCallStreamStore.getSnapShot()) {
    const name = toolCall.function?.name;

    if (name) {
      let content = '';
      try {
        const result = await executeOperation(
          name,
          toolCall.function.arguments,
        );
        content = JSON.stringify({
          status: 'ok',
          info: result,
        } as OperationResult);
      } catch (err) {
        console.error(err);
        content = JSON.stringify({
          status: 'failed',
          info: err instanceof Error ? err.message : err,
        } as OperationResult);
      }

      messageHistoryStore.addMessage({
        role: 'assistant' as const,
        function_call: null,
        content: null,
        tool_calls: [
          toolCallStreamStore.toChatCompletionMessageToolCall(toolCall),
        ],
      });
      toolCallStreamStore.deleteToolCallById(toolCall.id);
      messageHistoryStore.addMessage({
        role: 'tool' as const,
        tool_call_id: toolCall.id,
        content,
      });
    }
  }
}
