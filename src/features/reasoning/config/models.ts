import {
  ReasoningModelConfig,
  SupportedModels,
} from '../../../core/types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
  defaultInputPlaceholderText,
} from './prompts/defaultPrompts';
import KavaIcon from '../../../core/assets/KavaIcon';
import { calculateFinalChunkTokenUsage } from '../helpers';

const supportedReasoningModels = ['qwq-32b-bnb-4bit', 'deepseek-r1'] as const;

export type SupportedReasoningModel = (typeof supportedReasoningModels)[number];

export function isReasoningModel(
  modelId: SupportedModels,
): modelId is SupportedReasoningModel {
  return supportedReasoningModels.includes(modelId as SupportedReasoningModel);
}

export const reasoningModels: Record<
  SupportedReasoningModel,
  ReasoningModelConfig
> = {
  'qwq-32b-bnb-4bit': {
    id: 'qwq-32b-bnb-4bit',
    name: 'General Reasoning',
    icon: KavaIcon,
    description: 'Logical Analysis',
    includeUsageInStream: true,
    tools: [],
    supportedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    maximumFileUploads: 4,
    maximumFileBytes: 8 * 1024 * 1024,
    contextLength: 65536,
    contextLimitMonitor: calculateFinalChunkTokenUsage,
    contextWarningThresholdPercentage: 5,
    conversationResetTokenThreshold: 100,
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
    inputPlaceholderText: defaultInputPlaceholderText,
  },
  'deepseek-r1': {
    id: 'deepseek-r1',
    name: 'General Reasoning',
    icon: KavaIcon,
    description: 'Logical Analysis',
    includeUsageInStream: true,
    tools: [],
    supportedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    maximumFileUploads: 4,
    maximumFileBytes: 8 * 1024 * 1024,
    contextLength: 8192,
    contextLimitMonitor: calculateFinalChunkTokenUsage,
    contextWarningThresholdPercentage: 5,
    conversationResetTokenThreshold: 100,
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
    inputPlaceholderText: defaultInputPlaceholderText,
  },
};
