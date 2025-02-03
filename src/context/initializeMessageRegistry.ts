import { OperationRegistry } from '../features/blockchain/services/registry';
import { LendDepositMessage } from '../features/blockchain/services/messages/kava/lend/msgDeposit';
import { EvmTransferMessage } from '../features/blockchain/services/messages/evm/transfer';
import { EvmBalancesQuery } from '../features/blockchain/services/evm/evmBalances';
import { ERC20ConversionMessage } from '../features/blockchain/services/messages/kava/evmutil/erc20Conversion';

/**
 * Initializes the operation registry with all supported operations.
 * Called once when the hook is first used.
 * @returns Initialized OperationRegistry
 */
export function initializeMessageRegistry(): OperationRegistry<unknown> {
  const registry = new OperationRegistry();
  // Register all supported operations

  /** TODO: This probably needs to not be manual */
  registry.register(new LendDepositMessage());
  registry.register(new EvmTransferMessage());
  registry.register(new EvmBalancesQuery());
  registry.register(new ERC20ConversionMessage());
  return registry;
}
