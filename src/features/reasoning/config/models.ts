import { ReasoningModelConfig } from '../../../core/types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
  defaultInputPlaceholderText,
} from './prompts/defaultPrompts';
import KavaIcon from '../../../core/assets/KavaIcon';

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
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
    inputPlaceholderText: defaultInputPlaceholderText,
  },
};
