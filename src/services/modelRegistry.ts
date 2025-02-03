import { initializeRegistry } from '../context/initializeRegistry';

const registry = initializeRegistry();

export const MODEL_REGISTRY = {
  blockchain: {
    'gpt-4o': {
      name: 'gpt-4o',
      description:
        'A robust and powerful model for executing blockchain-specific actions',
      tools: registry.getToolDefinitions(),
      systemPrompt: registry.getSystemPrompt(),
      introText: registry.getIntroText(),
    },
    'gpt-4o-mini': {
      name: 'gpt-4o-mini',
      description: 'A slightly leaner model (can be used in automated testing)',
      tools: registry.getToolDefinitions(),
      systemPrompt: registry.getSystemPrompt(),
      introText: registry.getIntroText(),
    },
  },
  reasoning: {
    'deepseek-chat': {
      name: 'deepseek-chat',
      description:
        'Specialized model for logical analysis and problem-solving in non-blockchain contexts',
      tools: [],
      //  todo - create reasoning-specific prompts
      systemPrompt: registry.getSystemPrompt(),
      introText: registry.getIntroText(),
    },
  },
};
