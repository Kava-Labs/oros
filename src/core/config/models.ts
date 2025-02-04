import { blockchainModels } from '../../features/blockchain/config/models';
import { reasoningModels } from '../../features/reasoning/config/models';
import { ModelRegistry } from '../types/models';

export const MODEL_REGISTRY: ModelRegistry = {
  blockchain: { ...blockchainModels },
  reasoning: { ...reasoningModels },
};
