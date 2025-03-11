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
import { doChat, syncWithLocalStorage, newConversation } from './utils';
import type { ChatCompletionContentPart } from 'openai/resources/index';

let client: OpenAI | null = null;

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

  const [modelConfig, setModelConfig] = useState<ModelConfig>(() =>
    getModelConfig(DEFAULT_MODEL_NAME),
  );

  const [conversation, setConversation] = useState<ActiveConversation>(() => {
    const newConv = newConversation();

    const messages = newConv.messageHistoryStore.getSnapshot();
    if (messages.length === 0) {
      newConv.messageHistoryStore.addMessage({
        role: 'system',
        content: modelConfig.systemPrompt,
      });
    }

    return newConv;
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

  const ensureCorrectSystemPrompt = useCallback(
    (messageStore: MessageHistoryStore, modelConfig: ModelConfig) => {
      const messages = messageStore.getSnapshot();
      const systemPrompt = modelConfig.systemPrompt;

      // If no messages, add the system message
      if (messages.length === 0) {
        messageStore.addMessage({
          role: 'system',
          content: systemPrompt,
        });
      } else if (messages[0].role === 'system') {
        // If first message is system, update it
        const updatedMessages = [...messages];
        updatedMessages[0] = {
          role: 'system',
          content: systemPrompt,
        };
        messageStore.setMessages(updatedMessages);
      }
    },
    [],
  );

  const handleModelChange = useCallback(
    (modelName: SupportedModels) => {
      const newConfig = getModelConfig(modelName);
      setModelConfig(newConfig);

      // Only update system prompt if there are no user messages yet
      const messages = messageHistoryStore.getSnapshot();
      const hasUserMessages = messages.some((msg) => msg.role === 'user');

      if (!hasUserMessages) {
        ensureCorrectSystemPrompt(messageHistoryStore, newConfig);
      }
    },
    [messageHistoryStore, ensureCorrectSystemPrompt],
  );

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
    const newConv = newConversation();
    ensureCorrectSystemPrompt(newConv.messageHistoryStore, modelConfig);
    setConversation(newConv);
  }, [modelConfig, ensureCorrectSystemPrompt]);

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

  // abort controller for cancelling openai request
  const controllerRef = useRef<AbortController | null>(null);

  const handleChatCompletion = useCallback(
    async (value: string | Array<ChatCompletionContentPart>) => {
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
        modelConfig,
        messageHistoryStore,
        client,
      );

      // Call chat completions and resolve all tool calls.
      // This is recursive and completes when all tools calls have been made
      // and all follow ups have been completed.
      try {
        //  clear any existing error
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
          conversationID,
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

        conversation.errorStore.setText(errorMessage);
      } finally {
        setIsRequesting(false, id);
        controllerRef.current = null;
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
      thinkingStore.setText('');
    }
  }, [thinkingStore, toolCallStreamStore]);

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
