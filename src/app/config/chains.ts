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

export const KAVA_COSMOS_CONFIG: ChainConfig = {
  chainId: 'kava_2222-10',
  chainName: 'Kava SDK',
  restUrls: ['https://api2.kava.io'],
  rpcUrls: ['https://rpc.data.kava.io'],
  nativeCurrency: {
    displayName: 'KAVA',
    microDenom: 'ukava',
    symbol: 'KAVA',
    decimals: 6,
  },
  blockExplorerUrls: ['https://kava.mintscan.io'],
  bech32Config: {
    bech32Prefix: 'kava',
  },
  /**
   * TODO: IBC Chain configuration may need to live here as well
   *       ideally, we don't need to have a configuration for "which
   *       partners are setup" and rather have a "how to get from A to B"
   *       using someone partners' path to get there.
   */
};

export const KAVA_EVM_CONFIG: ChainConfig = {
  chainId: '2222',
  chainName: 'Kava EVM',
  restUrls: ['https://evm.kava.io'],
  rpcUrls: ['https://rpc.data.kava.io'],
  /**
   * TODO: I think the fee currency remains relevant like this for EVM
   *       driven transactions, but need to think about what this looks
   *       like from a user perspective.
   */
  nativeCurrency: {
    displayName: 'KAVA',
    microDenom: 'ukava',
    symbol: 'KAVA',
    decimals: 6,
  },
  blockExplorerUrls: ['https://kavascan.com'],
  bech32Config: {
    bech32Prefix: 'kava',
  },
};

export const CHAIN_CONFIGS: ChainConfigs = [
  KAVA_COSMOS_CONFIG,
  KAVA_EVM_CONFIG,
];
