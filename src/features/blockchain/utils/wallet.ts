import { WalletStore, WalletTypes } from '../stores/walletStore';
import { ChainType } from '../types/chain';
import { chainRegistry } from '../config/chainsRegistry';
import { isMobileDevice } from '../../../core/utils/isMobileDevice';

/**
 * Validates if the wallet is connected and compatible
 * @param walletStore The wallet store instance
 * @param requiredWalletTypes Array of required wallet types
 * @returns boolean - true if wallet is valid, throws error otherwise
 */
export function validateWallet(
  walletStore: WalletStore,
  requiredWalletTypes: WalletTypes[] | null,
): boolean {
  if (isMobileDevice()) {
    throw new Error('Use a desktop device to connect a wallet');
  }

  if (!walletStore.getSnapshot().isWalletConnected) {
    throw new Error('please connect to a compatible wallet');
  }

  if (Array.isArray(requiredWalletTypes)) {
    if (!requiredWalletTypes.includes(walletStore.getSnapshot().walletType)) {
      throw new Error('please connect to a compatible wallet');
    }
  }

  return true;
}

/**
 * Validates if a chain name exists in the registry
 * @param chainType The type of chain (EVM, etc.)
 * @param chainName The name of the chain to validate
 * @returns boolean - true if chain is valid, throws error otherwise
 */
export function validateChain(
  chainType: ChainType,
  chainName: string,
): boolean {
  if (!chainRegistry[chainType][chainName]) {
    throw new Error(`unknown chain name ${chainName}`);
  }

  return true;
}
