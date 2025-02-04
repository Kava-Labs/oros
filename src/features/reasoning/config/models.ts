import { ReasoningModelConfig } from '../../../core/types/models';
import { SupportedReasoningModels } from '../../../services/modelRegistry';
import {
  defaultIntroText,
  defaultSystemPrompt,
} from './prompts/defaultPrompts';

export const reasoningModels: Record<
  SupportedReasoningModels,
  ReasoningModelConfig
> = {
  'deepseek-chat': {
    name: 'deepseek-chat',
    description: 'Specialized model for logical analysis and problem-solving',
    tools: [],
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
  },
};
