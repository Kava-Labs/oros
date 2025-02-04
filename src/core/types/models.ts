import { ChatCompletionTool } from 'openai/resources/index';
import { ComponentType } from 'react';
import { WalletStore } from '../../features/blockchain/stores/walletStore';

export interface ModelOperations {
  executeOperation: (operationName: string, params: unknown) => Promise<any>;
  isOperationValidated: boolean;
}

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
  createOperations?: (walletStore: WalletStore) => ModelOperations;
}

export interface BlockchainModelConfig extends BaseModelConfig {
  tools: ChatCompletionTool[];
  createOperations: (walletStore: WalletStore) => ModelOperations;
}

export type ReasoningModelConfig = BaseModelConfig;

export type ModelConfig = BlockchainModelConfig | ReasoningModelConfig;

export interface ModelRegistry {
  blockchain: Record<string, BlockchainModelConfig>;
  reasoning: Record<string, ReasoningModelConfig>;
}
