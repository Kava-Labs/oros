import { ReactNode, useCallback, useState } from 'react';
import { WalletStore } from '../../features/blockchain/stores/walletStore';
import { MessageHistoryStore } from '../stores/messageHistoryStore';
import { TextStreamStore } from '../stores/textStreamStore';
import { ToolCallStreamStore } from '../stores/toolCallStreamStore';
import { ModelConfig } from '../types/models';
import { getModelConfig } from '../config/models';
import { AppContext } from './AppContext';

export const AppContextProvider = ({
  children,
  walletStore,
  messageStore,
  toolCallStreamStore,
  progressStore,
  messageHistoryStore,
}: {
  children: ReactNode;
  walletStore: WalletStore;
  messageStore: TextStreamStore;
  toolCallStreamStore: ToolCallStreamStore;
  progressStore: TextStreamStore;
  messageHistoryStore: MessageHistoryStore;
}) => {
  const [errorText, setErrorText] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [modelConfig, setModelConfig] = useState<ModelConfig>(() =>
    getModelConfig('gpt-4o-mini'),
  );

  // This callback would be passed to components that need to switch models
  const handleModelChange = useCallback((modelName: string) => {
    const newConfig = getModelConfig(modelName);
    setModelConfig(newConfig);
  }, []);

  const operations = modelConfig.getOperations?.(walletStore);

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
        // Spread operations if they exist
        ...operations,
        errorText,
        setErrorText,
        isReady,
        setIsReady,
        isRequesting,
        setIsRequesting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
