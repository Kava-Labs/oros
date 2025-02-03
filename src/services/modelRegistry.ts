import { initializeRegistry } from '../context/AppContextProvider';

const registry = initializeRegistry();

export const MODEL_REGISTRY = {
  'gpt-4o': {
    name: 'gpt-4o',
    tools: registry.getToolDefinitions(),
  },
  'gpt-4o-mini': {
    name: 'gpt-4o-mini',
    tools: registry.getToolDefinitions(),
  },
  'deepseek-chat': {
    name: 'deepseek-chat',
    tools: [],
  },
};
