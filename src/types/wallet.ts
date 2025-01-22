/**
 * Configuration interface for blockchain networks.
 * Contains all necessary information to connect to and interact with a blockchain.
 */
export interface ChainConfig {
  chainId: string;
  chainName: string;
  restUrls: string[];
  rpcUrls: string[];
  nativeCurrency: {
    displayName: string;
    microDenom: string; // maybe this isn't needed?
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls: string[];
  bech32Config?: {
    bech32Prefix: string;
  };
}

export type ChainConfigs = ChainConfig[];

/**
 * Interface defining the required functionality for wallet providers.
 * All wallet implementations (Metamask, Keplr, etc.) must implement this interface.
 */
export interface WalletProvider {
  connect(chainConfig: ChainConfig): Promise<string | null>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
  getAddress(): Promise<string>;
  signTransaction(tx: unknown): Promise<unknown>;
}
