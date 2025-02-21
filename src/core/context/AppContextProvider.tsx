import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
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
import { ActiveConversation, ConversationHistory } from './types';
import { getToken } from '../../core/utils/token/token';
import OpenAI from 'openai';
import {
  assembleToolCallsFromStream,
  isContentChunk,
  isToolCallChunk,
} from '../utils/streamUtils';
import { OperationResult } from '../../features/blockchain/types/chain';
import { ExecuteOperation } from '../../core/context/types';
import { v4 as uuidv4 } from 'uuid';
import { formatConversationTitle } from '../utils/conversation/helpers';

let client: OpenAI | null = null;

const newConversation = () => {
  return {
    conversationID: uuidv4(),
    messageStore: new TextStreamStore(),
    thinkingStore: new TextStreamStore(),
    progressStore: new TextStreamStore(),
    errorStore: new TextStreamStore(),
    messageHistoryStore: new MessageHistoryStore(),
    toolCallStreamStore: new ToolCallStreamStore(),
    isRequesting: false,
  };
};

export const AppContextProvider = (props: {
  children: React.ReactNode;
  walletStore: WalletStore;
  thinkingStore: TextStreamStore;
  errorStore: TextStreamStore;
  messageStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
}) => {
  const { children, walletStore } = props;

  const [isReady, setIsReady] = useState(false);
  const [registry] = useState<OperationRegistry<unknown>>(() =>
    initializeMessageRegistry(),
  );

  const [conversation, setConversation] = useState<ActiveConversation>({
    conversationID: uuidv4(),
    messageHistoryStore: props.messageHistoryStore,
    toolCallStreamStore: props.toolCallStreamStore,
    thinkingStore: props.thinkingStore,
    progressStore: props.progressStore,
    messageStore: props.messageStore,
    errorStore: new TextStreamStore(),
    isRequesting: false,
  });

  const {
    conversationID,
    isRequesting,
    messageHistoryStore,
    toolCallStreamStore,
    messageStore,
    progressStore,
    thinkingStore,
    errorStore,
  } = conversation;

  const activeConversationsRef = useRef<Map<string, ActiveConversation>>(null);

  useEffect(() => {
    if (!activeConversationsRef.current) {
      activeConversationsRef.current = new Map();
    }

    activeConversationsRef.current.set(
      conversation.conversationID,
      conversation,
    );
  }, [conversation]);

  const setIsRequesting = useCallback((isRequesting: boolean, id: string) => {
    const conv = activeConversationsRef.current?.get(id);
    if (conv) {
      conv.isRequesting = isRequesting;
    }

    setConversation((prev) => {
      if (prev.conversationID === id) {
        return { ...prev, isRequesting };
      }
      return prev;
    });
  }, []);

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

  const contextMetrics = modelConfig.contextLimitMonitor
    ? modelConfig.contextLimitMonitor(messageHistoryStore.getSnapshot())
    : null;

  useEffect(() => {
    async function checkMetrics() {
      if (contextMetrics) {
        const metrics = await contextMetrics;
        console.log('contextMetrics', metrics);
      }
    }

    checkMetrics();
  }, [contextMetrics]);

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

  const handleModelChange = useCallback((modelName: SupportedModels) => {
    const newConfig = getModelConfig(modelName);
    setModelConfig(newConfig);
  }, []);

  const { executeOperation, isOperationValidated } = useExecuteOperation(
    registry,
    walletStore,
  );

  const loadConversation = useCallback(
    (convoHistory: ConversationHistory) => {
      handleModelChange(convoHistory.model as SupportedModels);
      let activeConversation = activeConversationsRef.current?.get(
        convoHistory.id,
      );

      if (!activeConversation) {
        activeConversation = newConversation();
        activeConversation.conversationID = convoHistory.id; // make sure to link the ids
        activeConversation.messageHistoryStore.loadConversation(convoHistory);
      }

      setConversation(activeConversation);
    },
    [handleModelChange],
  );

  const startNewChat = useCallback(() => {
    setConversation(newConversation());
  }, []);

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

      const id = conversationID;

      // should not happen
      if (!client) {
        console.error('client usage before ready');
        return;
      }

      toolCallStreamStore.clear();
      // Abort controller integrated with UI
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsRequesting(true, id);

      // Add the user message to the UI
      messageHistoryStore.addMessage({ role: 'user' as const, content: value });
      // save to local storage (pre-request with user's prompt)
      syncWithLocalStorage(
        conversationID,
        modelConfig.id,
        messageHistoryStore,
        client,
      );

      // Call chat completions and resolve all tool calls.
      //
      // This is recursive and completes when all tools calls have been made
      // and all follow ups have been completed.
      try {
        //  clear any existing error
        // setErrorText('');
        conversation.errorStore.setText('');

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

        // setErrorText(errorMessage);
        conversation.errorStore.setText(errorMessage);
      } finally {
        setIsRequesting(false, id);
        controllerRef.current = null;
        // save to local storage (post-request with assistant's response)
        syncWithLocalStorage(
          conversationID,
          modelConfig.id,
          messageHistoryStore,
          client,
        );
      }
    },
    [
      isRequesting,
      conversationID,
      toolCallStreamStore,
      setIsRequesting,
      messageHistoryStore,
      modelConfig,
      conversation.errorStore,
      progressStore,
      messageStore,
      thinkingStore,
      executeOperation,
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
        conversationID,
        client,
        messageHistoryStore,
        messageStore,
        progressStore,
        walletStore,
        toolCallStreamStore,
        modelConfig,
        handleModelChange,
        startNewChat,
        handleReset,
        handleCancel,
        handleChatCompletion,
        thinkingStore,
        errorStore,
        loadConversation,
        executeOperation,
        registry,
        isReady,
        isRequesting,
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

async function syncWithLocalStorage(
  conversationID: string,
  modelID: string,
  messageHistoryStore: MessageHistoryStore,
  client: OpenAI,
) {
  const messages = messageHistoryStore.getSnapshot();
  const firstUserMessage = messages.find((msg) => msg.role === 'user');
  if (!firstUserMessage) return;

  const { content } = firstUserMessage;

  const allConversations: Record<string, ConversationHistory> = JSON.parse(
    localStorage.getItem('conversations') ?? '{}',
  );

  const existingConversation = allConversations[conversationID];
  const history: ConversationHistory = {
    id: conversationID,
    model: existingConversation ? existingConversation.model : modelID,
    title: 'New Chat', // initial & fallback value
    conversation: messages,
    lastSaved: new Date().valueOf(),
  };

  if (existingConversation && existingConversation.conversation.length <= 4) {
    try {
      const data = await client.chat.completions.create({
        stream: false,
        messages: [
          {
            role: 'system',
            content:
              'your task is to generate a title for a conversation using 3 to 4 words',
          },
          {
            role: 'user',
            content: `Please generate a title for this conversation (max 4 words):
                      ${messages.map((msg) => {
                        // only keep user/assistant messages
                        if (msg.role !== 'user' && msg.role !== 'assistant')
                          return;

                        return `Role: ${msg.role} 
                                      ${msg.content}
                        `;
                      })}
                      `,
          },
        ],
        model: 'gpt-4o-mini',
      });

      // Apply truncation only when we get the AI-generated title
      const generatedTitle =
        data.choices[0].message.content ?? (content as string);
      history.title = formatConversationTitle(generatedTitle, 34);
    } catch (err) {
      history.title = content as string;
      console.error(err);
    }
  }

  allConversations[conversationID] = history;
  localStorage.setItem('conversations', JSON.stringify(allConversations));
}
