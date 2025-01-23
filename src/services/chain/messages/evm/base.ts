import { ChainMessage } from '../../../../types/chain';
import { MessageParam } from '../../../../types/messages';

export abstract class EvmMessageBase<T> implements ChainMessage {
  abstract name: string;
  operationType = 'transaction' as const;
  chainType = 'evm' as const;
  abstract description: string;
  abstract parameters: Array<MessageParam>;

  abstract validate(params: T): boolean;

  abstract buildTransaction(params: T): Promise<unknown>;
}
