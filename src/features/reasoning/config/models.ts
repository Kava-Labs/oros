import { ReasoningModelConfig } from '../../../core/types/models';
import {
  defaultIntroText,
  defaultSystemPrompt,
} from '../prompts/defaultPrompts';

export const reasoningModels: Record<string, ReasoningModelConfig> = {
  'deepseek-chat': {
    name: 'deepseek-chat',
    description: 'Specialized model for logical analysis and problem-solving',
    tools: [],
    systemPrompt: defaultSystemPrompt,
    introText: defaultIntroText,
  },
};
