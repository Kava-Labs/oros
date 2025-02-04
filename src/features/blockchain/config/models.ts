import {
  CompleteTxDisplay,
  CompleteQueryDisplay,
  InProgressQueryDisplay,
  InProgressTxDisplay,
} from '../components/displayCards';
import { BlockchainModelConfig } from '../../../core/types/models';
import { initializeMessageRegistry } from './initializeMessageRegistry';
import { useExecuteOperation } from '../hooks/useExecuteOperation';

export const messageRegistry = initializeMessageRegistry();

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
    getOperations: (walletStore) => {
      const { executeOperation, isOperationValidated } = useExecuteOperation(
        messageRegistry,
        walletStore,
      );
      return { executeOperation, isOperationValidated };
    },
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
    getOperations: (walletStore) => {
      const { executeOperation, isOperationValidated } = useExecuteOperation(
        messageRegistry,
        walletStore,
      );
      return { executeOperation, isOperationValidated };
    },
  },
};
