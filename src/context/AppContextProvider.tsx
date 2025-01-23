import React, { useCallback, useState } from 'react';
import { AppContext } from './AppContext';
import { OperationRegistry } from '../services/chain/registry';
import { CosmosSendMessage } from '../services/chain/messages/cosmos/msgSend';
import { ChainMessage, ChainQuery } from '../types/chain';
import { LendDepositMessage } from '../services/chain/messages/kava/lend/msgDeposit';
import { EvmTransferMessage } from '../services/chain/messages/evm/transfer';

/**
 * Initializes the operation registry with all supported operations.
 * Called once when the hook is first used.
 * @returns Initialized OperationRegistry
 */
function initializeRegistry(): OperationRegistry {
  const registry = new OperationRegistry();
  // Register all supported operations

  /** TODO: This probably needs to not be manual */
  registry.register(new CosmosSendMessage());
  registry.register(new LendDepositMessage());
  registry.register(new EvmTransferMessage());
  return registry;
}

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [errorText, setErrorText] = useState('');
  // use is sending request to signify to the chat view that
  // a request is in progress so it can disable inputs
  // use is sending request to signify to the chat view that
  // a request is in progress so it can disable inputs
  const [isRequesting, setIsRequesting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [registry] = useState<OperationRegistry>(() => initializeRegistry());

  // Memoized to prevent unnecessary regeneration.
  const getOpenAITools = useCallback(() => {
    return registry.getToolDefinitions();
  }, [registry]);

  /**
   * Executes a chain operation with the provided parameters.
   * Handles both transaction and query operations.
   * @param operationType - Type identifier for the operation
   * @param params - Parameters for the operation
   * @returns Result of the operation (transaction or query result)
   */
  const executeOperation = useCallback(
    async (operationName: string, params: unknown) => {
      const operation = registry.get(operationName);
      if (!operation) {
        throw new Error(`Unknown operation type: ${operationName}`);
      }

      if (!operation.validate(params)) {
        throw new Error('Invalid parameters for operation');
      }

      if ('buildTransaction' in operation) {
        return (operation as ChainMessage).buildTransaction(params);
      } else if ('executeQuery' in operation) {
        return (operation as ChainQuery).executeQuery(params);
      }

      throw new Error('Invalid operation type');
    },
    [registry],
  );

  return (
    <AppContext.Provider
      value={{
        getOpenAITools,
        executeOperation,
        registry,

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
