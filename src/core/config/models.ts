import {
  blockchainModels,
  SupportedBlockchainModels,
} from '../../features/blockchain/config/models';
import { reasoningModels } from '../../features/reasoning/config/models';
import { ModelConfig, ModelRegistry, SupportedModels } from '../types/models';

const isQwenSupported = import.meta.env.VITE_FEAT_QWEN === 'true';

export const MODEL_REGISTRY: ModelRegistry = {
  blockchain: blockchainModels,
  reasoning: reasoningModels,
};

export const isBlockchainModelName = (
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
  //  todo - consolidate when qwen is released
  const baseReasoningModels = Object.values(MODEL_REGISTRY.reasoning);
  const reasoningModelsWithFeature = baseReasoningModels.filter(
    (modelConfig) => modelConfig.id !== 'deepseek-r1',
  );
  const reasoningModelsWithoutFeature = baseReasoningModels.filter(
    (modelConfig) => modelConfig.id !== 'qwq-32b-bnb-4bit',
  );

  const reasoningModels = isQwenSupported
    ? reasoningModelsWithFeature
    : reasoningModelsWithoutFeature;

  return [...Object.values(MODEL_REGISTRY.blockchain), ...reasoningModels];
};

const DEFAULT_REASONING_MODEL = isQwenSupported
  ? 'qwq-32b-bnb-4bit'
  : 'deepseek-r1';

export const DEFAULT_MODEL_NAME = DEFAULT_REASONING_MODEL;
