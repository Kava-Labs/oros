import { initializeRegistry } from '../context/initializeRegistry';

const registry = initializeRegistry();

export const MODEL_REGISTRY = {
  blockchain: {
    'gpt-4o': {
      name: 'gpt-4o',
      tools: registry.getToolDefinitions(),
    },
    'gpt-4o-mini': {
      name: 'gpt-4o-mini',
      tools: registry.getToolDefinitions(),
    },
  },
  reasoning: {
    'deepseek-chat': {
      name: 'deepseek-chat',
      tools: [],
    },
  },
};
