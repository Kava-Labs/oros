import { ChatCompletionTool } from 'openai/resources/index';
import { ComponentType } from 'react';
import { SupportedBlockchainModels } from '../../features/blockchain/config/models';
import { SupportedReasoningModels } from '../../features/reasoning/config/models';

export interface BaseModelConfig {
  name: string;
  description: string;
  tools: ChatCompletionTool[];
  systemPrompt: string;
  introText: string;
  components?: {
    transaction?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inProgress: ComponentType<any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      complete: ComponentType<any>;
    };
    query?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inProgress: ComponentType<any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      complete: ComponentType<any>;
    };
  };
}
export interface BlockchainModelConfig extends BaseModelConfig {
  tools: ChatCompletionTool[];
}

export type ReasoningModelConfig = BaseModelConfig;

export interface ModelRegistry {
  blockchain: Record<SupportedBlockchainModels, BlockchainModelConfig>;
  reasoning: Record<SupportedReasoningModels, ReasoningModelConfig>;
}
