import { ReasoningModelConfig } from '../../../core/types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
  defaultInputPlaceholderText,
} from './prompts/defaultPrompts';
import DeepseekIcon from '../assets/DeepseekIcon';

export type SupportedReasoningModels = 'deepseek-chat';

export const reasoningModels: Record<
  SupportedReasoningModels,
  ReasoningModelConfig
> = {
  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek R1 67TB',
    icon: DeepseekIcon,
    description: 'Logical Analysis Engine',
    tools: [],
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
    inputPlaceholderText: defaultInputPlaceholderText,
  },
};
