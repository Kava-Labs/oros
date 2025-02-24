import { BlockchainModelConfig } from '../../../core/types/models';
import { OrosIcon } from '../assets/OrosIcon';
import {
  CompleteQueryDisplay,
  CompleteTxDisplay,
  InProgressQueryDisplay,
  InProgressTxDisplay,
} from '../components/displayCards';
import { initializeMessageRegistry } from './initializeMessageRegistry';
import { blockchainMessageProcessor } from './messageProcessing';

const messageRegistry = initializeMessageRegistry();

export type SupportedBlockchainModels = 'gpt-4o'; //| 'gpt-4o-mini';

export const blockchainModels: Record<
  SupportedBlockchainModels,
  BlockchainModelConfig
> = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'Blockchain Instruct',
    icon: OrosIcon,
    description: 'Blockchain Execution',
    tools: messageRegistry.getToolDefinitions(),
    //  https://platform.openai.com/docs/models#gpt-4o
    contextLength: 128000,
    systemPrompt: messageRegistry.getSystemPrompt(),
    introText: messageRegistry.getIntroText(),
    inputPlaceholderText: messageRegistry.getInputPlaceholderText(),
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
  // 'gpt-4o-mini': {
  //   id: 'gpt-4o-mini',
  //   name: 'Blockchain Instruct - mini',
  //   icon: OrosIcon,
  //   description: 'A slightly leaner model (can be used in automated testing)',
  //   tools: messageRegistry.getToolDefinitions(),
  //   systemPrompt: messageRegistry.getSystemPrompt(),
  //   introText: messageRegistry.getIntroText(),
  //   components: {
  //     transaction: {
  //       inProgress: InProgressTxDisplay,
  //       complete: CompleteTxDisplay,
  //     },
  //     query: {
  //       inProgress: InProgressQueryDisplay,
  //       complete: CompleteQueryDisplay,
  //     },
  //   },
  //   messageProcessors: blockchainMessageProcessor,
  // },
};
