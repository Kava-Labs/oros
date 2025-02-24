import { ReasoningModelConfig } from '../../../core/types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
  defaultInputPlaceholderText,
} from './prompts/defaultPrompts';
import KavaIcon from '../../../core/assets/KavaIcon';
import { calculateContextMetrics } from '../../../core/utils/conversation/helpers';

export type SupportedReasoningModels = 'deepseek-r1';

export const reasoningModels: Record<
  SupportedReasoningModels,
  ReasoningModelConfig
> = {
  'deepseek-r1': {
    id: 'deepseek-r1',
    name: 'General Reasoning',
    icon: KavaIcon,
    description: 'Logical Analysis',
    tools: [],
    //  https://github.com/deepseek-ai/DeepSeek-R1?tab=readme-ov-file#deepseek-r1-models
    contextLength: 128000,
    contextLimitMonitor: calculateContextMetrics,
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
    inputPlaceholderText: defaultInputPlaceholderText,
  },
};
