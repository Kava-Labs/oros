import { useCallback, useState } from 'react';
import { CosmosSendMessage } from '../services/chain/messages/cosmos-msgSend';
import { OperationRegistry } from '../services/chain/registry';
import { ChainMessage, ChainQuery } from '../types/chain';

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
  return registry;
}

/**
 * Hook that provides access to chain operations and AI tool definitions.
 * Manages the lifecycle of the operation registry and provides methods
 * for executing operations.
 */
export function useChainOperations() {
  // Initialize registry once and maintain it across renders
  const [registry] = useState(() => initializeRegistry());

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
    async (operationType: string, params: unknown) => {
      const operation = registry.get(operationType);
      if (!operation) {
        throw new Error(`Unknown operation type: ${operationType}`);
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

  return {
    registry,
    getOpenAITools,
    executeOperation,
  };
}
