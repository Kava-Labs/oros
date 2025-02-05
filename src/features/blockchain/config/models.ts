import { BlockchainModelConfig } from '../../../core/types/models';
import {
  CompleteQueryDisplay,
  CompleteTxDisplay,
  InProgressQueryDisplay,
  InProgressTxDisplay,
} from '../components/displayCards';
import { initializeMessageRegistry } from './initializeMessageRegistry';
import { blockchainMessageProcessor } from './messageProcessing';

const messageRegistry = initializeMessageRegistry();

export type SupportedBlockchainModels = 'gpt-4o' | 'gpt-4o-mini';

export const blockchainModels: Record<
  SupportedBlockchainModels,
  BlockchainModelConfig
> = {
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
    messageProcessors: blockchainMessageProcessor,
  },
};
