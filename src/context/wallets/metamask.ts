import React from 'react';
import { SignatureTypes, SignOpts, WalletTypes } from '../WalletContext';

type WalletSetter = React.Dispatch<
  React.SetStateAction<{
    address: string;
    chainId: string;
    walletType: WalletTypes;
  }>
>;

export const connectMetamask = async (setWallet: WalletSetter) => {
  const accounts: string[] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
  if (Array.isArray(accounts) && accounts.length) {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });

    setWallet({
      address: accounts[0],
      chainId: chainId,
      walletType: WalletTypes.METAMASK,
    });
  }
};

export const addMetamaskChangeListeners = ({
  onAccountChange,
  onChainChange,
}: {
  onAccountChange: (setWallet: WalletSetter) => void;
  onChainChange: () => void;
}) => {
  // @ts-expect-error window.ethereum.on does exist
  window.ethereum.on('chainChanged', onAccountChange);
  // @ts-expect-error window.ethereum.on does exist
  window.ethereum.on('accountsChanged', onChainChange);
};

export const removeMetamaskChangeListeners = ({
  onAccountChange,
  onChainChange,
}: {
  onAccountChange: (setWallet: WalletSetter) => void;
  onChainChange: () => void;
}) => {
  // @ts-expect-error window.ethereum.off does exist
  window.ethereum.off('chainChanged', onAccountChange);
  // @ts-expect-error window.ethereum.off does exist
  window.ethereum.off('accountsChanged', onChainChange);
};

export const metamaskSign = async (opts: SignOpts) => {
  if (opts.signatureType === SignatureTypes.EVM) {
    return await window.ethereum.request({
      method: 'eth_sendTransaction',
      // @ts-expect-error todo: improved types
      params: opts.payload,
    });
  } else if (opts.signatureType === SignatureTypes.EIP712) {
    // todo: implement
  }
};
