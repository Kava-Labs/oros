import { initializeMessageRegistry } from '../core/context/initializeMessageRegistry';
import { ChatCompletionTool } from 'openai/resources/index';
import { ComponentType } from 'react';
import {
  CompleteTxDisplay,
  CompleteTxDisplayProps,
} from '../features/blockchain/components/displayCards/CompleteTxDisplay';
import {
  InProgressQueryDisplay,
  InProgressQueryProps,
} from '../features/blockchain/components/displayCards/InProgressQueryDisplay';
import {
  CompleteQueryDisplay,
  InProgressTxDisplay,
} from '../features/blockchain/components/displayCards';
import { InProgressTxDisplayProps } from '../features/blockchain/components/displayCards/InProgressTxDisplay';
import { CompleteQueryDisplayProps } from '../features/blockchain/components/displayCards/CompleteQueryDisplay';
import { reasoningModels } from '../features/reasoning/config/models';
import { ReasoningModelConfig } from '../core/types/models';

export type SupportedBlockchainModels = 'gpt-4o' | 'gpt-4o-mini';
export type SupportedReasoningModels = 'deepseek-chat';

interface ModelConfig {
  name: SupportedBlockchainModels | SupportedReasoningModels;
  description: string;
  tools: ChatCompletionTool[];
  systemPrompt: string;
  introText: string;
  components?: {
    transaction?: {
      inProgress: ComponentType<InProgressTxDisplayProps>;
      complete: ComponentType<CompleteTxDisplayProps>;
    };
    query?: {
      inProgress: ComponentType<InProgressQueryProps>;
      complete: ComponentType<CompleteQueryDisplayProps>;
    };
  };
}

interface ModelRegistry {
  blockchain: Record<SupportedBlockchainModels, ModelConfig>;
  reasoning: Record<SupportedReasoningModels, ReasoningModelConfig>;
}

const messageRegistry = initializeMessageRegistry();

export const MODEL_REGISTRY: ModelRegistry = {
  blockchain: {
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
    },
  },
  reasoning: { ...reasoningModels },
};
