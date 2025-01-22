import { ethers } from 'ethers';
import { ChainConfig, WalletProvider } from '../../../types/wallet';

/**
 * Implementation of the WalletProvider interface for MetaMask.
 * Handles all MetaMask-specific wallet operations including connection,
 * transaction signing, and state management.
 */
export class MetamaskWallet implements WalletProvider {
  private address: string | null = null;
  /** Ethers.js provider instance */
  private provider: ethers.BrowserProvider | null = null;

  /**
   * Ensures the MetaMask extension is available in the browser.
   * @throws Error if MetaMask is not detected
   */
  private async ensureEthereum(): Promise<any> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Metamask not detected');
    }
    return window.ethereum;
  }

  async connect(chainConfig: ChainConfig): Promise<string | null> {
    const ethereum = await this.ensureEthereum();

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainId }],
      });
    } catch (error: any) {
      // If the chain doesn't exist, add it.
      // https://docs.metamask.io/wallet/reference/json-rpc-methods/wallet_switchethereumchain/
      if (error.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainConfig.chainId,
              rpcUrls: chainConfig.rpcUrls,
              chainName: chainConfig.chainName,
              nativeCurrency: chainConfig.nativeCurrency,
              blockExplorerUrls: chainConfig.blockExplorerUrls,
            },
          ],
        });
      } else {
        throw error;
      }
    }

    this.provider = new ethers.BrowserProvider(ethereum);

    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    this.address = accounts[0];
    return this.address;
  }

  async disconnect(): Promise<void> {
    this.address = null;
    this.provider = null;
  }

  async isConnected(): Promise<boolean> {
    if (!this.address) return false;
    const ethereum = await this.ensureEthereum();
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0 && accounts[0] === this.address;
  }

  async getAddress(): Promise<string> {
    if (!this.address) {
      throw new Error('Wallet not connected');
    }
    return this.address;
  }

  /**
   * Signs a transaction using MetaMask.
   * @param tx - Transaction to sign
   * @throws Error if wallet is not connected
   */
  async signTransaction(tx: any): Promise<any> {
    if (!this.provider || !this.address) {
      throw new Error('Wallet not connected');
    }
    const signer = await this.provider.getSigner();
    /**
     * TODO: Need to add custom signer logic here
     */
  }
}
