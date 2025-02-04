import {
  BlockchainModelConfig,
  ModelConfig,
  ModelRegistry,
} from '../types/models';
import { blockchainModels } from '../../features/blockchain/config/models';
import { reasoningModels } from '../../features/reasoning/config/models';

export const MODEL_REGISTRY: ModelRegistry = {
  blockchain: blockchainModels,
  reasoning: reasoningModels,
};

export const getModelByName = (name: string): ModelConfig | undefined => {
  return MODEL_REGISTRY.blockchain[name] || MODEL_REGISTRY.reasoning[name];
};

export const getModelConfig = (name: string): ModelConfig => {
  const model = getModelByName(name);
  if (!model) {
    throw new Error(`Model ${name} not found`);
  }
  return model;
};

export const isBlockchainModel = (
  model: ModelConfig,
): model is BlockchainModelConfig => {
  return model === MODEL_REGISTRY.blockchain[model.name];
};

export const getAllModels = (): ModelConfig[] => {
  return [
    ...Object.values(MODEL_REGISTRY.blockchain),
    ...Object.values(MODEL_REGISTRY.reasoning),
  ];
};
