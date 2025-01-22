import { ChainConfig, WalletProvider } from '../../types/wallet';
import { MetamaskWallet } from './providers/metamask';

/**
 * Class that manages wallet connections across the application.
 * Handles wallet initialization, connection state, and provides access to
 * the current wallet instance.
 */
export class WalletManager {
  private static instance: WalletManager;
  /** Currently active wallet provider */
  private currentWallet: WalletProvider | null = null;
  /** TODO: Is this flag needed, or will LLM be smart enough */
  /** Flag to prevent multiple auto-connect attempts */
  private autoConnectAttempted = false;

  private constructor() {}

  /**
   * Gets the instance of the WalletManager.
   * Creates the instance if it doesn't exist.
   */
  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  /**
   * Initializes a MetaMask wallet connection.
   * Only attempts to connect once unless explicitly reset.
   * @param chainConfig - Configuration for the chain to connect to
   * @returns Connected address or null if connection fails
   */
  async initializeMetamask(chainConfig: ChainConfig): Promise<string | null> {
    if (this.autoConnectAttempted) {
      return null;
    }

    try {
      const metamask = new MetamaskWallet();
      const address = await metamask.connect(chainConfig);
      this.currentWallet = metamask;
      return address;
    } catch (error) {
      console.error('Failed to initialize Metamask:', error);
      return null;
    } finally {
      this.autoConnectAttempted = true;
    }
  }

  /**
   * Gets the currently active wallet provider.
   * @returns Current wallet provider or null if not connected
   */
  async getCurrentWallet(): Promise<WalletProvider | null> {
    return this.currentWallet;
  }

  /**
   * Disconnects the current wallet and cleans up state.
   */
  async disconnectWallet(): Promise<void> {
    if (this.currentWallet) {
      await this.currentWallet.disconnect();
      this.currentWallet = null;
    }
  }
}
