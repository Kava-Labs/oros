import { MessageParam } from './messages';
import { ToolCallStream } from '../../../core/stores/toolCallStreamStore';
import { WalletTypes, WalletStore } from '../stores/walletStore';

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
export interface ChainOperation<T> {
  /** Unique identifier for the operation name */
  name: string;
  chainType: ChainType;
  /** Human-readable description of what the operation does */
  description: string;
  /** List of parameters this operation accepts */
  parameters: MessageParam[];

  /** Identifies this as a transaction operation */
  operationType: OperationType;

  needsWallet?: WalletTypes[];

  /* when set to true, the operation will attempt to switch the wallet network to the chainID this operation expects */
  walletMustMatchChainID?: boolean;

  /** Validates the provided parameters match requirements */
  validate(params: T, walletStore: WalletStore): boolean | Promise<boolean>;

  /** Optional React component that displays as the model is streaming the tool call arguments */
  inProgressComponent?: () => React.FunctionComponent<{
    toolCall: ToolCallStream;
    onRendered?: () => void;
  }>;
}

/**
 * Interface for blockchain transaction messages.
 * Extends ChainOperation to add transaction-specific functionality.
 */
export interface ChainMessage<T> extends ChainOperation<T> {
  /** Builds the transaction object from the provided parameters */
  buildTransaction(params: T, walletStore: WalletStore): Promise<string>;
}

/**
 * Interface for blockchain queries.
 * Extends ChainOperation to add query-specific functionality.
 */
export interface ChainQuery<T> extends ChainOperation<T> {
  /** Executes the query with the provided parameters */
  executeQuery(params: T, walletStore: WalletStore): Promise<string>;
}

export type OperationResult = {
  status: 'ok' | 'failed';
  info: string;
};
