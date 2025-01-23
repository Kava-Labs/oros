import { ChainMessage } from '../../../types/chain';
import { CosmosMsg, MessageParam } from '../../../types/messages';

// Base abstract class for Cosmos messages
export abstract class CosmosMessageBase<T, MsgArgs> implements ChainMessage {
  abstract name: string;
  operationType = 'transaction' as const;
  chainType = 'cosmos' as const;
  abstract description: string;
  abstract parameters: Array<MessageParam>;

  abstract validate(params: T): boolean;

  abstract buildTransaction(params: T): Promise<CosmosMsg<MsgArgs>>;
}
