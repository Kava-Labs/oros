import { ReasoningModelConfig } from '../../../core/types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
} from './prompts/defaultPrompts';
import DeepseekIcon from '../assets/DeepseekIcon';

export type SupportedReasoningModels = 'deepseek-chat';

export const reasoningModels: Record<
  SupportedReasoningModels,
  ReasoningModelConfig
> = {
  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek RI 67TB',
    icon: DeepseekIcon,
    description: 'Specialized model for logical analysis and problem-solving',
    tools: [],
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
  },
};
