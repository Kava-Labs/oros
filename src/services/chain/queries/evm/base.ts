import { MessageParam } from '../../../../types/messages';
import {
  ChainOperation,
  ChainType,
  OperationType,
} from '../../../../types/chain';

export abstract class QueryBase<T> implements ChainOperation {
  abstract name: string;
  operationType = OperationType.QUERY;
  chainType = ChainType.EVM;

  abstract description: string;
  abstract parameters: Array<MessageParam>;

  abstract validate(params: T): boolean;

  abstract executeQuery(params: T): Promise<string>;
}
