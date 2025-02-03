import { useCallback, useState } from 'react';
import {
  WalletStore,
  WalletTypes,
} from '../features/blockchain/stores/walletStore';
import {
  ChainNames,
  chainNameToolCallParam,
  chainRegistry,
  CosmosChainConfig,
} from '../features/blockchain/config/chainsRegistry';
import {
  ChainType,
  ChainMessage,
  ChainQuery,
} from '../features/blockchain/types/chain';
import { OperationRegistry } from '../features/blockchain/services/registry';

export const useExecuteOperation = (
  registry: OperationRegistry<unknown>,
  walletStore: WalletStore,
) => {
  /**
   * Executes a chain operation with the provided parameters.
   * Handles both transaction and query operations.
   * @param operationType - Type identifier for the operation
   * @param params - Parameters for the operation
   * @returns Result of the operation (transaction or query result)
   */

  const [isOperationValidated, setIsOperationValidated] = useState(false);
  const executeOperation = useCallback(
    async (operationName: string, params: unknown) => {
      setIsOperationValidated(false);

      const operation = registry.get(operationName);
      if (!operation) {
        throw new Error(`Unknown operation type: ${operationName}`);
      }

      let chainId = `0x${Number(2222).toString(16)}`; // default
      let chainName = ChainNames.KAVA_EVM; // default

      if (
        typeof params === 'object' &&
        params !== null &&
        chainNameToolCallParam.name in params
      ) {
        // @ts-expect-error we already checked this
        chainName = params[chainNameToolCallParam.name];
        const chain = chainRegistry[operation.chainType][chainName];
        chainId =
          operation.chainType === ChainType.EVM
            ? `0x${Number(chain.chainID).toString(16)}`
            : String(chain.chainID);
      }

      // if operation needs wallet connect
      // and the current wallet connection isn't one that's included in wantsWallet
      // we then try to establish that connection
      if (
        operation.needsWallet &&
        Array.isArray(operation.needsWallet) &&
        !operation.needsWallet.includes(walletStore.getSnapshot().walletType)
      ) {
        for (const walletType of operation.needsWallet) {
          await walletStore.connectWallet({
            walletType,
            chainId,
          });

          break;
        }
      }

      // if the chain id in metamask doesn't match the chain id we need to be on
      // start the network switching process
      if (
        operation.walletMustMatchChainID &&
        walletStore.getSnapshot().walletType === WalletTypes.METAMASK &&
        walletStore.getSnapshot().walletChainId !== chainId
      ) {
        switch (operation.chainType) {
          case ChainType.COSMOS: {
            // for cosmos chains using metamask
            // get the evmChainName and use that to find the chainID we are supposed to be on
            // if those don't match we can then switch to the correct evm network
            const { evmChainName } = chainRegistry[operation.chainType][
              chainName
            ] as CosmosChainConfig;
            if (evmChainName) {
              if (
                `0x${chainRegistry[ChainType.EVM][evmChainName].chainID.toString(16)}` !==
                walletStore.getSnapshot().walletChainId
              ) {
                await walletStore.metamaskSwitchNetwork(evmChainName);
              }
            }
            break;
          }
          default: {
            await walletStore.metamaskSwitchNetwork(chainName);
          }
        }
      }

      const validatedParams = await operation.validate(params, walletStore);

      if (!validatedParams) {
        throw new Error('Invalid parameters for operation');
      }
      setIsOperationValidated(true);
      if ('buildTransaction' in operation) {
        return (operation as ChainMessage<unknown>).buildTransaction(
          params,
          walletStore,
        );
      } else if ('executeQuery' in operation) {
        return (operation as ChainQuery<unknown>).executeQuery(
          params,
          walletStore,
        );
      }

      throw new Error('Invalid operation type');
    },
    [registry, walletStore],
  );

  return {
    executeOperation,
    isOperationValidated,
  };
};
