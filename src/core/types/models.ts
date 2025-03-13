import {
  ChatCompletionChunk,
  ChatCompletionTool,
} from 'openai/resources/index';
import { ComponentType } from 'react';
import { SupportedBlockchainModels } from '../../features/blockchain/config/models';
import { SupportedReasoningModel } from '../../features/reasoning/config/models';
import { ChatMessage } from '../stores/messageHistoryStore';

export type SupportedModels =
  | SupportedBlockchainModels
  | SupportedReasoningModel;

export interface BaseModelConfig {
  id: SupportedModels;
  name: string;
  icon: ComponentType;
  description: string;
  includeUsageInStream: boolean;
  supportedFileTypes: Array<SupportedFileType>;
  maximumFileUploads: number;
  maximumFileBytes: number;
  contextLength: number;
  contextLimitMonitor: (
    messages: ChatMessage[],
    contextLength: number,
    finalChunk?: ChatCompletionChunk,
  ) => Promise<ContextMetrics>;
  contextWarningThresholdPercentage: number;
  conversationResetTokenThreshold: number;
  tools: ChatCompletionTool[];
  systemPrompt: string;
  introText: string;
  inputPlaceholderText: string;
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
  messageProcessors?: {
    preProcess?: (message: string) => string;
    postProcess?: (message: string) => string;
  };
}
export interface BlockchainModelConfig extends BaseModelConfig {
  tools: ChatCompletionTool[];
  messageProcessors: {
    preProcess: (message: string) => string;
    postProcess: (message: string) => string;
  };
}

export type ReasoningModelConfig = BaseModelConfig;

export type ModelConfig = BlockchainModelConfig | ReasoningModelConfig;

export interface ModelRegistry {
  blockchain: Record<SupportedBlockchainModels, BlockchainModelConfig>;
  reasoning: Record<SupportedReasoningModel, ReasoningModelConfig>;
}

export interface ContextMetrics {
  tokensRemaining: number;
}

export const SUPPORTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

export function isSupportedFileType(type: string): type is SupportedFileType {
  return SUPPORTED_FILE_TYPES.includes(type as SupportedFileType);
}
