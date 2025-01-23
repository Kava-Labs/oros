import { MessageParam } from '../../../types/messages';
import { ChainOperation } from '../../../types/chain';

export abstract class QueryBase<T> implements ChainOperation {
  abstract name: string;
  operationType = 'query' as const;
  chainType = 'evm' as const;

  abstract description: string;
  abstract parameters: Array<MessageParam>;

  abstract validate(params: T): boolean;

  abstract executeQuery(params: T): Promise<string>;
}
