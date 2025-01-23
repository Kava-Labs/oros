import {
  ChainMessage,
  ChainType,
  OperationType,
  WalletConnection,
} from '../../../../types/chain';
import { MessageParam } from '../../../../types/messages';

export abstract class EvmMessageBase<T> implements ChainMessage {
  abstract name: string;
  operationType = OperationType.TRANSACTION;
  chainType = ChainType.EVM;
  abstract description: string;
  abstract parameters: Array<MessageParam>;

  abstract validate(params: T, wallet: WalletConnection): boolean;

  abstract buildTransaction(params: T, wallet: WalletConnection): Promise<string>;
}
