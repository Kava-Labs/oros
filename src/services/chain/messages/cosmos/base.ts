import { ChainMessage, CosmosMsg } from '../../../../types/chain';

// Base abstract class for Cosmos messages
export abstract class CosmosMessageBase<T, MsgArgs> implements ChainMessage {
  abstract type: string;
  operationType = 'transaction' as const;
  chainType = 'cosmos' as const;
  abstract description: string;
  abstract parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;

  abstract validate(params: T): boolean;

  abstract buildTransaction(params: T): Promise<CosmosMsg<MsgArgs>>;
}
