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
      // @ts-ignore
      inProgress: ComponentType<any>;
      // @ts-ignore
      complete: ComponentType<any>;
    };
    query?: {
      // @ts-ignore
      inProgress: ComponentType<any>;
      // @ts-ignore
      complete: ComponentType<any>;
    };
  };
  getOperations?: (walletStore: WalletStore) => ModelOperations;
}

export interface BlockchainModelConfig extends BaseModelConfig {
  tools: ChatCompletionTool[];
  getOperations: (walletStore: WalletStore) => ModelOperations;
}

export type ReasoningModelConfig = BaseModelConfig;

export type ModelConfig = BlockchainModelConfig | ReasoningModelConfig;

export interface ModelRegistry {
  blockchain: Record<string, BlockchainModelConfig>;
  reasoning: Record<string, ReasoningModelConfig>;
}
