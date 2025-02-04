import {
  blockchainModels,
  SupportedBlockchainModels,
} from '../../features/blockchain/config/models';
import { reasoningModels } from '../../features/reasoning/config/models';
import { ModelConfig, ModelRegistry, SupportedModels } from '../types/models';

export const MODEL_REGISTRY: ModelRegistry = {
  blockchain: blockchainModels,
  reasoning: reasoningModels,
};

const isBlockchainModelName = (
  name: SupportedModels,
): name is SupportedBlockchainModels => {
  return Object.keys(MODEL_REGISTRY.blockchain).includes(name);
};

export const getModelByName = (
  name: SupportedModels,
): ModelConfig | undefined => {
  if (isBlockchainModelName(name)) {
    return MODEL_REGISTRY.blockchain[name];
  }
  return MODEL_REGISTRY.reasoning[name];
};

export const getModelConfig = (name: SupportedModels): ModelConfig => {
  const model = getModelByName(name);
  if (!model) {
    throw new Error(`Model ${name} not found`);
  }
  return model;
};

export const getAllModels = (): ModelConfig[] => {
  return [
    ...Object.values(MODEL_REGISTRY.blockchain),
    ...Object.values(MODEL_REGISTRY.reasoning),
  ];
};
