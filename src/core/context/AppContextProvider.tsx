import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { AppContext } from './AppContext';
import { OperationRegistry } from '../../features/blockchain/services/registry';
import { WalletStore } from '../../features/blockchain/stores/walletStore';
import { TextStreamStore } from '../../core/stores/textStreamStore';
import { ToolCallStreamStore } from '../../core/stores/toolCallStreamStore';
import { MessageHistoryStore } from '../../core/stores/messageHistoryStore';
import { initializeMessageRegistry } from '../../features/blockchain/config/initializeMessageRegistry';
import { useExecuteOperation } from './useExecuteOperation';
import { DEFAULT_MODEL_NAME, getModelConfig } from '../config/models';
import { SupportedModels, ModelConfig } from '../types/models';
import { useMessageSaver } from './useMessageSaver';
import { ConversationHistory } from './types';
import { getToken } from '../../core/utils/token/token';
import OpenAI from 'openai';
import {
  assembleToolCallsFromStream,
  isContentChunk,
  isToolCallChunk,
} from '../utils/streamUtils';
import { OperationResult } from '../../features/blockchain/types/chain';
import { ExecuteOperation } from '../../core/context/types';

let client: OpenAI | null = null;

export const AppContextProvider = ({
  children,
  walletStore,
  messageStore,
  toolCallStreamStore,
  progressStore,
  messageHistoryStore,
  thinkingStore,
}: {
  children: React.ReactNode;
  walletStore: WalletStore;
  thinkingStore: TextStreamStore;
  messageStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
}) => {
  const [errorText, setErrorText] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [registry] = useState<OperationRegistry<unknown>>(() =>
    initializeMessageRegistry(),
  );

  const [conversations, setConversations] = useState<ConversationHistory[]>(
    () => {
      const stored = localStorage.getItem('conversations');
      if (!stored) return [];
      try {
        return Object.values(JSON.parse(stored)) as ConversationHistory[];
      } catch (e) {
        console.error('Error parsing conversations:', e);
        return [];
      }
    },
  );

  const [modelConfig, setModelConfig] = useState<ModelConfig>(() =>
    getModelConfig(DEFAULT_MODEL_NAME),
  );

  // Poll for conversation changes
  useEffect(() => {
    const load = () => {
      const storedConversations = Object.values(
        JSON.parse(localStorage.getItem('conversations') ?? '{}'),
      ) as ConversationHistory[];
      setConversations(storedConversations);
    };

    const id = setInterval(load, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const hasConversations = useMemo(
    () => conversations.length > 0,
    [conversations],
  );

  const handleModelChange = useCallback(
    (modelName: SupportedModels) => {
      const newConfig = getModelConfig(modelName);
      setModelConfig(newConfig);
      messageHistoryStore.reset();
      messageHistoryStore.setMessages([
        { role: 'system', content: newConfig.systemPrompt },
      ]);
    },
    [messageHistoryStore],
  );

  const { executeOperation, isOperationValidated } = useExecuteOperation(
    registry,
    walletStore,
  );

  useMessageSaver(messageHistoryStore, modelConfig.id, client!);

  const loadConversation = useCallback(
    (convoHistory: ConversationHistory) => {
      handleModelChange(convoHistory.model as SupportedModels);
      messageHistoryStore.loadConversation(convoHistory);
      setErrorText('');
      progressStore.setText('');
    },
    [messageHistoryStore, handleModelChange, progressStore],
  );

  useEffect(() => {
    try {
      client = new OpenAI({
        baseURL: import.meta.env['VITE_OPENAI_BASE_URL'],
        apiKey: getToken(),
        dangerouslyAllowBrowser: true,
      });
    } catch (err) {
      console.error(err);
      return;
    }

    setIsReady(true);
  }, []);

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

  return (
    <AppContext.Provider
      value={{
        client,
        messageHistoryStore,
        messageStore,
        progressStore,
        walletStore,
        toolCallStreamStore,
        modelConfig,
        handleModelChange,
        handleReset,
        handleCancel,
        handleChatCompletion,
        thinkingStore,
        loadConversation,
        executeOperation,
        registry,
        errorText,
        setErrorText,
        isReady,
        setIsReady,
        isRequesting,
        setIsRequesting,
        isOperationValidated,
        conversations,
        hasConversations,
      }}
    >
      {children}
    </AppContext.Provider>
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
          if ('reasoningContent' in msg) {
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
        // todo: chance to clean up into a helper similar to assembleToolCallFromStream
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
