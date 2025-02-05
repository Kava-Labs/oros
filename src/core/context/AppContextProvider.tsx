import React, { useCallback, useState } from 'react';
import { AppContext } from './AppContext';
import { OperationRegistry } from '../../features/blockchain/services/registry';
import { WalletStore } from '../../features/blockchain/stores/walletStore';
import { TextStreamStore } from '../../core/stores/textStreamStore';
import { ToolCallStreamStore } from '../../core/stores/toolCallStreamStore';
import { MessageHistoryStore } from '../../core/stores/messageHistoryStore';
import { initializeMessageRegistry } from '../../features/blockchain/config/initializeMessageRegistry';
import { useExecuteOperation } from './useExecuteOperation';
import { getModelConfig } from '../config/models';
import { SupportedModels, ModelConfig } from '../types/models';
import { useMessageSaver } from './useMessageSaver';

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
    getModelConfig('gpt-4o-mini'),
  );

  // This callback would be passed to components that need to switch models
  const handleModelChange = useCallback((modelName: SupportedModels) => {
    const newConfig = getModelConfig(modelName);
    setModelConfig(newConfig);
  }, []);

  const { executeOperation, isOperationValidated } = useExecuteOperation(
    registry,
    walletStore,
  );

  useMessageSaver(messageHistoryStore, modelConfig);
  
  return (
    <AppContext.Provider
      value={{
        messageHistoryStore,
        messageStore,
        progressStore,
        walletStore,
        toolCallStreamStore,
        modelConfig,
        handleModelChange,
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
