import {
  CompleteTxDisplay,
  CompleteQueryDisplay,
  InProgressQueryDisplay,
  InProgressTxDisplay,
} from '../components/displayCards';
import {
  BlockchainModelConfig,
  ModelOperations,
} from '../../../core/types/models';
import { initializeMessageRegistry } from './initializeMessageRegistry';
import { WalletStore, WalletTypes } from '../stores/walletStore';
import {
  ChainNames,
  chainNameToolCallParam,
  chainRegistry,
  CosmosChainConfig,
} from '../config/chainsRegistry';
import { ChainMessage, ChainQuery, ChainType } from '../types/chain';
import { blockchainMessageProcessor } from './messageProcessing';

export const messageRegistry = initializeMessageRegistry();

const createBlockchainOperations = (walletStore: WalletStore) => {
  return {
    executeOperation: async (operationName: string, params: unknown) => {
      const operation = messageRegistry.get(operationName);
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
            const { evmChainName } = chainRegistry[ChainType.COSMOS][
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
    isOperationValidated: true,
  };
};

export const defaultOperations: ModelOperations = {
  executeOperation: async () => {
    throw new Error('Operations not supported');
  },
  isOperationValidated: false,
};

export const blockchainModels: Record<string, BlockchainModelConfig> = {
  'gpt-4o': {
    name: 'gpt-4o',
    description:
      'A robust and powerful model for executing blockchain-specific actions',
    tools: messageRegistry.getToolDefinitions(),
    systemPrompt: messageRegistry.getSystemPrompt(),
    introText: messageRegistry.getIntroText(),
    components: {
      transaction: {
        inProgress: InProgressTxDisplay,
        complete: CompleteTxDisplay,
      },
      query: {
        inProgress: InProgressQueryDisplay,
        complete: CompleteQueryDisplay,
      },
    },
    createOperations: createBlockchainOperations,
    messageProcessors: blockchainMessageProcessor,
  },
  'gpt-4o-mini': {
    name: 'gpt-4o-mini',
    description: 'A slightly leaner model (can be used in automated testing)',
    tools: messageRegistry.getToolDefinitions(),
    systemPrompt: messageRegistry.getSystemPrompt(),
    introText: messageRegistry.getIntroText(),
    components: {
      transaction: {
        inProgress: InProgressTxDisplay,
        complete: CompleteTxDisplay,
      },
      query: {
        inProgress: InProgressQueryDisplay,
        complete: CompleteQueryDisplay,
      },
    },
    createOperations: createBlockchainOperations,
    messageProcessors: blockchainMessageProcessor,
  },
};
