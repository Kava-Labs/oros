import { ModelConfig, SupportedModels } from '../../types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
  defaultInputPlaceholderText,
} from './defaultPrompts';
import KavaIcon from '../../assets/KavaIcon';
import { calculateFinalChunkTokenUsage } from './helpers';
import { calculateGptContextMetrics } from '../../utils/conversation/helpers';

export const models: Record<SupportedModels, ModelConfig> = {
  'qwq-32b-bnb-4bit': {
    id: 'qwq-32b-bnb-4bit',
    name: 'General Reasoning',
    reasoningModel: true,
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
    reasoningModel: true,
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
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'General Purpose',
    icon: KavaIcon,
    description: 'Logical Analysis',
    includeUsageInStream: false,
    reasoningModel: false,
    tools: [],
    supportedFileTypes: [],
    maximumFileUploads: 0,
    maximumFileBytes: 0,
    //  https://platform.openai.com/docs/models#gpt-4o
    contextLength: 128000,
    contextLimitMonitor: calculateGptContextMetrics,
    contextWarningThresholdPercentage: 5,
    conversationResetTokenThreshold: 100,
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
    inputPlaceholderText: defaultInputPlaceholderText,
  },
};

export function isReasoningModel(modelId: SupportedModels): boolean {
  return models[modelId].reasoningModel;
}
