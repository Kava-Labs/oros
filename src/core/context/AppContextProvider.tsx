import React, { useCallback, useEffect, useState } from 'react';
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

let client: OpenAI | null = null;

export const AppContextProvider = ({
  children,
  walletStore,
  messageStore,
  toolCallStreamStore,
  progressStore,
  messageHistoryStore,
}: {
  children: React.ReactNode;
  walletStore: WalletStore;
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

  const [modelConfig, setModelConfig] = useState<ModelConfig>(() =>
    getModelConfig(DEFAULT_MODEL_NAME),
  );

  // This callback would be passed to components that need to switch models
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
