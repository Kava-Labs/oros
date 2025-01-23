import { MessageParam } from './messages';
import { ToolCallStream } from '../toolCallStreamStore';

export enum OperationType {
  TRANSACTION = 'transaction',
  QUERY = 'query',
}

export enum ChainType {
  COSMOS = 'cosmos',
  EVM = 'evm',
}

/**
 * Base interface for all chain operations.
 * Both messages (transactions) and queries extend this interface.
 */
export interface ChainOperation {
  /** Unique identifier for the operation name */
  name: string;
  chainType: ChainType;
  /** Human-readable description of what the operation does */
  description: string;
  /** List of parameters this operation accepts */
  parameters: MessageParam[];
  /** Validates the provided parameters match requirements */
  validate(params: unknown): boolean;

  /** Optional React component that displays as the model is streaming the tool call arguments */
  inProgressComponent?: () => React.FunctionComponent<ToolCallStream>;
}

/**
 * Interface for blockchain transaction messages.
 * Extends ChainOperation to add transaction-specific functionality.
 */
export interface ChainMessage extends ChainOperation {
  /** Identifies this as a transaction operation */
  operationType: OperationType;
  /** Builds the transaction object from the provided parameters */
  buildTransaction(params: unknown): Promise<string>;
}

/**
 * Interface for blockchain queries.
 * Extends ChainOperation to add query-specific functionality.
 */
export interface ChainQuery extends ChainOperation {
  /** Identifies this as a query operation */
  operationType: OperationType;
  /** Executes the query with the provided parameters */
  executeQuery(params: unknown): Promise<string>;
}
