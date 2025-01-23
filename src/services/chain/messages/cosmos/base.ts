<<<<<<< HEAD:src/services/chain/messages/base.ts
import { ChainMessage } from '../../../types/chain';
import { MessageParam } from '../../../types/messages';

// Base abstract class for Cosmos messages
export abstract class CosmosMessageBase<T> implements ChainMessage {
=======
import { ChainMessage } from '../../../../types/chain';
import { CosmosMsg, MessageParam } from '../../../../types/messages';

// Base abstract class for Cosmos messages

export abstract class CosmosMessageBase<T, MsgArgs> implements ChainMessage {
>>>>>>> 6ef9403 (feat: implement eth send):src/services/chain/messages/cosmos/base.ts
  abstract name: string;
  operationType = 'transaction' as const;
  chainType = 'cosmos' as const;
  abstract description: string;
  abstract parameters: Array<MessageParam>;

  abstract validate(params: T): boolean;

  abstract buildTransaction(params: T): Promise<string>;
}
