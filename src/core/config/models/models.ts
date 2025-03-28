import { ModelConfig, SupportedModels } from '../../types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
  defaultInputPlaceholderText,
} from './defaultPrompts';
import KavaIcon from '../../assets/KavaIcon';
import { calculateFinalChunkTokenUsage } from './helpers';
import { calculateGptContextMetrics } from '../../utils/conversation/helpers';

export const MODEL_REGISTRY: Record<SupportedModels, ModelConfig> = {
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
    supportedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    tools: [],
    maximumFileUploads: 4,
    maximumFileBytes: 8 * 1024 * 1024,
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
  return MODEL_REGISTRY[modelId].reasoningModel;
}
export const getModelByName = (
  name: SupportedModels,
): ModelConfig | undefined => {
  return MODEL_REGISTRY[name];
};

export const getModelConfig = (name: SupportedModels): ModelConfig => {
  const model = getModelByName(name);
  if (!model) {
    throw new Error(`Model ${name} not found`);
  }
  return model;
};

const isQwenSupported = import.meta.env.VITE_FEAT_QWEN === 'true';

export const getAllModels = (): ModelConfig[] => {
  //  todo - consolidate when qwen is released
  const baseReasoningModels = Object.values(MODEL_REGISTRY);
  const reasoningModelsWithFeature = baseReasoningModels.filter(
    (modelConfig) => modelConfig.id !== 'deepseek-r1',
  );
  const reasoningModelsWithoutFeature = baseReasoningModels.filter(
    (modelConfig) => modelConfig.id !== 'qwq-32b-bnb-4bit',
  );

  const reasoningModels = isQwenSupported
    ? reasoningModelsWithFeature
    : reasoningModelsWithoutFeature;

  return [...reasoningModels];
};

const DEFAULT_REASONING_MODEL = isQwenSupported
  ? 'qwq-32b-bnb-4bit'
  : 'deepseek-r1';

export const DEFAULT_MODEL_NAME = DEFAULT_REASONING_MODEL;
