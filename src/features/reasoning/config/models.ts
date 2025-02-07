import { ReasoningModelConfig } from '../../../core/types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
  defaultInputPlaceholderText,
} from './prompts/defaultPrompts';
import DeepseekIcon from '../assets/DeepseekIcon';

export type SupportedReasoningModels = 'deepseek-r1';

export const reasoningModels: Record<
  SupportedReasoningModels,
  ReasoningModelConfig
> = {
  'deepseek-r1': {
    id: 'deepseek-r1',
    name: 'DeepSeek R1 67TB',
    icon: DeepseekIcon,
    description: 'Logical Analysis Engine',
    tools: [],
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
    inputPlaceholderText: defaultInputPlaceholderText,
  },
};
