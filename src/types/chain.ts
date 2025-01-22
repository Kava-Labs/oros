/**
 * Defines a parameter for chain operations (messages or queries).
 * Used to validate inputs and generate OpenAI tool definitions.
 *
 * This might be too abstracted?
 */
export interface MessageParam {
  name: string;
  type: string;
  /** Human-readable description of what the operation does, maybe not needed */
  description: string;
  required: boolean;
}

/**
 * Base interface for all chain operations.
 * Both messages (transactions) and queries extend this interface.
 */
export interface ChainOperation {
  /** Unique identifier for the operation type */
  type: string;
  chainType: 'cosmos' | 'evm';
  /** Human-readable description of what the operation does */
  description: string;
  /** List of parameters this operation accepts */
  parameters: MessageParam[];
  /** Validates the provided parameters match requirements */
  validate(params: any): boolean;
}

/**
 * Interface for blockchain transaction messages.
 * Extends ChainOperation to add transaction-specific functionality.
 */
export interface ChainMessage extends ChainOperation {
  /** Identifies this as a transaction operation */
  operationType: 'transaction';
  /** Builds the transaction object from the provided parameters */
  buildTransaction(params: any): Promise<any>;
}

/**
 * Interface for blockchain queries.
 * Extends ChainOperation to add query-specific functionality.
 */
export interface ChainQuery extends ChainOperation {
  /** Identifies this as a query operation */
  operationType: 'query';
  /** Executes the query with the provided parameters */
  executeQuery(params: any): Promise<any>;
}
