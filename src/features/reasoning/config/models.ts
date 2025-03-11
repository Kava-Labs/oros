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

const supportedReasoningModels = ['deepseek-r1', 'qwq-32b-bnb-4bit'] as const;

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
  'deepseek-r1': {
    id: 'deepseek-r1',
    name: 'General Reasoning',
    icon: KavaIcon,
    description: 'Logical Analysis',
    tools: [],
    supportedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maximumFileUploads: 4,
    maximumFileBytes: 8 * 1024 * 1024, //  8MB
    //  not running full 128K token context currently
    contextLength: 8192,
    contextLimitMonitor: calculateFinalChunkTokenUsage,
    contextWarningThresholdPercentage: 5,
    conversationResetTokenThreshold: 100,
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
    inputPlaceholderText: defaultInputPlaceholderText,
  },
  'qwq-32b-bnb-4bit': {
    id: 'qwq-32b-bnb-4bit',
    name: 'General Reasoning',
    icon: KavaIcon,
    description: 'Logical Analysis',
    tools: [],
    supportedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
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
};
