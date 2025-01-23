import {
  ChainMessage,
  ChainType,
  OperationType,
} from '../../../../types/chain';
import { MessageParam } from '../../../../types/messages';

// Base abstract class for Cosmos messages
export abstract class CosmosMessageBase<T> implements ChainMessage {
  abstract name: string;
  operationType = OperationType.TRANSACTION;
  chainType = ChainType.COSMOS;
  abstract description: string;
  abstract parameters: Array<MessageParam>;

  abstract validate(params: T): boolean;

  abstract buildTransaction(params: T): Promise<string>;
}
