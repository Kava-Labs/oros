import {
  ChatCompletionChunk,
  ChatCompletionTool,
} from 'openai/resources/index';
import { ComponentType } from 'react';

import { ChatMessage } from '../stores/messageHistoryStore';

export const supportedModels = [
  'qwq-32b-bnb-4bit',
  'deepseek-r1',
  'gpt-4o',
] as const;

export type SupportedModels = (typeof supportedModels)[number];

export interface ModelConfig {
  id: SupportedModels;
  name: string;
  icon: ComponentType;
  description: string;
  includeUsageInStream: boolean;
  reasoningModel: boolean;
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

export type ModelRegistry = Record<SupportedModels, ModelConfig>;

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
