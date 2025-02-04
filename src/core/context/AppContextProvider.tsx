import React, { useCallback, useState } from 'react';
import { AppContext } from './AppContext';
import { OperationRegistry } from '../../features/blockchain/services/registry';
import { WalletStore } from '../../features/blockchain/stores/walletStore';
import { TextStreamStore } from '../../core/stores/textStreamStore';
import { ToolCallStreamStore } from '../../core/stores/toolCallStreamStore';
import { MessageHistoryStore } from '../../core/stores/messageHistoryStore';
import { ModelConfig } from './types';
import { initializeMessageRegistry } from '../../features/blockchain/config/initializeMessageRegistry';
import { useExecuteOperation } from './useExecuteOperation';
import { MODEL_REGISTRY } from '../config/models';
import { SupportedBlockchainModels } from '../../features/blockchain/config/models';
import { SupportedReasoningModels } from '../../features/reasoning/config/models';

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

  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    name: MODEL_REGISTRY.blockchain['gpt-4o-mini'].name,
    tools: MODEL_REGISTRY.blockchain['gpt-4o-mini'].tools,
    introText: MODEL_REGISTRY.blockchain['gpt-4o-mini'].introText,
    systemPrompt: MODEL_REGISTRY.blockchain['gpt-4o-mini'].systemPrompt,
    description: MODEL_REGISTRY.blockchain['gpt-4o-mini'].description,
  });

  const setModel = useCallback(
    (modelName: SupportedBlockchainModels | SupportedReasoningModels) => {
      if (modelName === 'deepseek-chat') {
        setModelConfig({
          name: MODEL_REGISTRY.reasoning[modelName].name,
          tools: MODEL_REGISTRY.reasoning[modelName].tools,
          introText: MODEL_REGISTRY.reasoning[modelName].introText,
          systemPrompt: MODEL_REGISTRY.reasoning[modelName].systemPrompt,
          description: MODEL_REGISTRY.reasoning[modelName].description,
        });
      } else {
        setModelConfig({
          name: MODEL_REGISTRY.blockchain[modelName].name,
          tools: MODEL_REGISTRY.blockchain[modelName].tools,
          introText: MODEL_REGISTRY.blockchain[modelName].introText,
          systemPrompt: MODEL_REGISTRY.blockchain[modelName].systemPrompt,
          description: MODEL_REGISTRY.blockchain[modelName].description,
        });
      }
    },
    [],
  );

  const { executeOperation, isOperationValidated } = useExecuteOperation(
    registry,
    walletStore,
  );

  return (
    <AppContext.Provider
      value={{
        messageHistoryStore,
        messageStore,
        progressStore,
        walletStore,
        toolCallStreamStore,
        modelConfig,
        setModel,
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
