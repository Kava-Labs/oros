import { ChainNames, chainRegistry } from './config/chainsRegistry';
import { ChainType } from './types/chain';

type Listener = () => void;

export enum WalletTypes {
  METAMASK = 'METAMASK',
  NONE = 'NONE',
}

export enum SignatureTypes {
  EIP712 = 'EIP712',
  EVM = 'EVM',
}
export type SignOpts = {
  chainId: string;
  signatureType: SignatureTypes;
  payload: unknown; // todo: msg? transaction payload? this structure would be different based on the signatureType
};

export type WalletConnection = {
  walletAddress: string;
  walletChainId: string;
  walletType: WalletTypes;
  isWalletConnected: boolean;
};

export class WalletStore {
  private currentValue: WalletConnection = {
    walletAddress: '',
    walletChainId: '',
    walletType: WalletTypes.NONE,
    isWalletConnected: false,
  };
  private listeners: Set<Listener> = new Set();

  constructor() {
    const onChainChange = () => {
      this.connectMetamask();
    };

    const onAccountChange = () => {
      this.connectMetamask();
    };

    this.subscribe(() => {
      const connection: WalletConnection = this.getSnapshot();
      // @ts-expect-error window.ethereum.off does exist
      window.ethereum.off('chainChanged', onChainChange);
      // @ts-expect-error window.ethereum.off does exist
      window.ethereum.off('accountsChanged', onAccountChange);

      if (connection.walletType === WalletTypes.METAMASK) {
        // @ts-expect-error window.ethereum.on does exist
        window.ethereum.on('chainChanged', onChainChange);
        // @ts-expect-error window.ethereum.on does exist
        window.ethereum.on('accountsChanged', onAccountChange);
      }
    });
  }

  public async connectWallet(opts: {
    chainId: string;
    walletType: WalletTypes;
  }) {
    switch (opts.walletType) {
      case WalletTypes.METAMASK: {
        await this.connectMetamask();
        break;
      }
      case WalletTypes.NONE: {
        this.disconnectWallet(); // disconnect when passed WalletTypes.NONE
        break;
      }
      default:
        throw new Error(`unknown wallet type: ${opts.walletType}`);
    }
  }

  public async metamaskSwitchNetwork(chainName: string) {
    const chain = chainRegistry[ChainType.EVM][chainName];
    if (!chain) {
      throw new Error(`unknown chain ${chainName}`);
    }

    const {
      chainID,
      rpcUrls,
      name,
      nativeToken,
      nativeTokenDecimals,
      blockExplorerUrls,
    } = chain;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainID.toString(16)}` }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      // @ts-expect-error metamask errors have .code property
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainID.toString(16)}`,
              chainName: name === ChainNames.KAVA_EVM ? 'Kava' : name,
              rpcUrls: rpcUrls,
              blockExplorerUrls,
              nativeCurrency: {
                name: nativeToken,
                symbol: nativeToken,
                decimals: nativeTokenDecimals,
              },
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  public disconnectWallet() {
    this.currentValue = {
      walletAddress: '',
      walletChainId: '',
      walletType: WalletTypes.NONE,
      isWalletConnected: false,
    };
    this.emitChange();
  }

  public sign(opts: SignOpts) {
    if (!this.getSnapshot().isWalletConnected) {
      throw new Error('no wallet connection detected');
    }

    if (this.getSnapshot().walletType === WalletTypes.METAMASK) {
      switch (opts.signatureType) {
        case SignatureTypes.EVM: {
          // @ts-expect-error better type needed
          return window.ethereum.request(opts.payload);
        }
        case SignatureTypes.EIP712: {
          throw new Error('EIP712 Signing not implemented at this moment');
        }
      }
    } else {
      throw new Error('Only Metamask Signing is supported at this moment');
    }
  }

  public getSnapshot = (): WalletConnection => {
    return this.currentValue;
  };

  public subscribe = (callback: Listener): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  private async connectMetamask() {
    const accounts: string[] = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    if (Array.isArray(accounts) && accounts.length) {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      this.currentValue = {
        walletAddress: accounts[0],
        walletChainId: chainId,
        walletType: WalletTypes.METAMASK,
        isWalletConnected: true,
      };
      this.emitChange();
    }
  }

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
