import { createContext } from 'react';

export enum WalletTypes {
  METAMASK = 'METAMASK',
  NONE = 'NONE',
}

export enum SignatureTypes {
  EIP712 = 'EIP712',
  EVM = 'EVM',
}

export type WalletConnectionOpts = {
  chainId: string;
  walletType: WalletTypes;
};

export type SignOpts = {
  chainId: string;
  signatureType: SignatureTypes;
  payload: unknown; // todo: msg? transaction payload? this structure would be different based on the signatureType
};

export type WalletContextType = {
  walletAddress: string;
  walletChainId: string;
  walletType: WalletTypes;
  isWalletConnected: boolean;
  connectWallet: (opts: WalletConnectionOpts) => Promise<void>;
  disconnectWallet: () => void;
  sign: (opts: SignOpts) => Promise<string>;
};

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined,
);
