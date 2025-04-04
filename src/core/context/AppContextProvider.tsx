import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppContext } from './AppContext';
import {
  TextStreamStore,
  getAllConversations,
  ConversationHistories,
  idbEventTarget,
  updateConversation,
  getConversationMessages,
  deleteConversation,
  getSearchableHistory,
  SearchableChatHistories,
} from 'lib-kava-ai';
import { MessageHistoryStore } from '../../core/stores/messageHistoryStore';
import { DEFAULT_MODEL_NAME, getModelConfig } from '../config';
import { SupportedModels, ModelConfig } from '../types/models';
import { ActiveConversation } from './types';
import { getToken } from '../../core/utils/token/token';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { doChat, syncWithLocalStorage, newConversation } from './utils';
import type { ChatCompletionMessageParam } from 'openai/resources/index';

let client: OpenAI | null = null;

export const AppContextProvider = (props: {
  children: React.ReactNode;
  thinkingStore: TextStreamStore;
  errorStore: TextStreamStore;
  messageStore: TextStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
}) => {
  const { children } = props;

  const [isReady, setIsReady] = useState(false);

  const [modelConfig, setModelConfig] = useState<ModelConfig>(() =>
    getModelConfig(DEFAULT_MODEL_NAME),
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

  const [conversation, setConversation] = useState<ActiveConversation>(() => {
    const newConv = {
      conversationID: uuidv4(),
      messageHistoryStore: props.messageHistoryStore,
      thinkingStore: props.thinkingStore,
      progressStore: props.progressStore,
      messageStore: props.messageStore,
      errorStore: new TextStreamStore(),
      isRequesting: false,
    };

    ensureCorrectSystemPrompt(newConv.messageHistoryStore, modelConfig);

    return newConv;
  });

  const {
    conversationID,
    isRequesting,
    messageHistoryStore,
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

  const [conversationHistories, setConversationHistories] =
    useState<ConversationHistories | null>(null);

  const fetchConversations = useCallback(() => {
    getAllConversations()
      .then((conversations) => {
        setConversationHistories(conversations);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    // do initial fetch
    fetchConversations();

    // set up event handler and refetch on update
    const getUpdatedConversations = () => fetchConversations();

    idbEventTarget.addEventListener(
      'indexeddb-update',
      getUpdatedConversations,
    );

    return () => {
      idbEventTarget.removeEventListener(
        'indexeddb-update',
        getUpdatedConversations,
      );
    };
  }, [fetchConversations]);

  const onSelectConversation = useCallback(
    async (id: string) => {
      if (id === conversation.conversationID) return;
      let activeConversation = activeConversationsRef.current?.get(id);
      if (!activeConversation && conversationHistories) {
        const selectedConversation = conversationHistories[id];
        if (selectedConversation) {
          const messages = await getConversationMessages(id);
          activeConversation = newConversation();
          activeConversation.conversationID = id;
          activeConversation.messageHistoryStore.loadConversation(
            messages ? messages : [],
          );
        }
      }

      if (activeConversation) setConversation(activeConversation);
    },
    [conversation, conversationHistories],
  );

  const onUpdateConversationTitle = useCallback(
    async (id: string, newTitle: string) => {
      await updateConversation(id, { title: newTitle });
    },
    [],
  );

  const [searchableHistory, setSearchableHistory] =
    useState<SearchableChatHistories | null>(null);

  const fetchSearchHistory = async () => {
    try {
      const history = await getSearchableHistory();
      setSearchableHistory(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

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

  const startNewChat = useCallback(() => {
    const newConv = newConversation();
    ensureCorrectSystemPrompt(newConv.messageHistoryStore, modelConfig);
    setConversation(newConv);
  }, [modelConfig, ensureCorrectSystemPrompt]);

  const onDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      activeConversationsRef.current?.delete(id);

      if (id === conversation.conversationID) {
        startNewChat();
      }
    },
    [startNewChat, conversation],
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

  // abort controller for cancelling openai request
  const controllerRef = useRef<AbortController | null>(null);

  const handleChatCompletion = useCallback(
    async (value: ChatCompletionMessageParam[]) => {
      if (isRequesting) {
        return;
      }

      const id = conversationID;

      // should not happen
      if (!client) {
        console.error('client usage before ready');
        return;
      }

      // Abort controller integrated with UI
      const controller = new AbortController();
      controllerRef.current = controller;
      setIsRequesting(true, id);

      // Add the user message to the UI
      messageHistoryStore.setMessages([
        ...messageHistoryStore.getSnapshot(),
        ...value,
      ]);
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
          thinkingStore,
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
      setIsRequesting,
      messageHistoryStore,
      modelConfig,
      conversation.errorStore,
      progressStore,
      messageStore,
      thinkingStore,
    ],
  );

  const handleCancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      thinkingStore.setText('');
    }
  }, [thinkingStore]);

  return (
    <AppContext.Provider
      value={{
        conversationID,
        client,
        messageHistoryStore,
        messageStore,
        progressStore,
        modelConfig,
        handleModelChange,
        startNewChat,
        handleCancel,
        handleChatCompletion,
        thinkingStore,
        errorStore,
        onSelectConversation,
        onDeleteConversation,
        onUpdateConversationTitle,
        isReady,
        isRequesting,
        fetchSearchHistory,
        searchableHistory,
        conversations: conversationHistories,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
