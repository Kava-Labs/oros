import React, { useCallback, useEffect, useState } from 'react';
import {
  SignatureTypes,
  SignOpts,
  WalletConnectionOpts,
  WalletContext,
  WalletTypes,
} from './WalletContext';

export const WalletContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [wallet, setWallet] = useState({
    address: '',
    chainId: '',
    walletType: WalletTypes.NONE,
  });

  const isWalletConnected: boolean = wallet.address.length > 0;

  const connectMetamask = useCallback(async () => {
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
  }, []);

  const connectWallet = useCallback(async (opts: WalletConnectionOpts) => {
    switch (opts.walletType) {
      case WalletTypes.METAMASK: {
        await connectMetamask();
        break;
      }
      case WalletTypes.NONE: {
        disconnectWallet(); // disconnect when passed WalletTypes.NONE
        break;
      }
      default:
        throw new Error(`unknown wallet type: ${opts.walletType}`);
    }
  }, []);

  const sign = useCallback(async (opts: SignOpts) => {
    // todo: implement
    if (opts.signatureType === SignatureTypes.EVM) {
      return await window.ethereum.request({
        method: 'eth_sendTransaction',
        // @ts-expect-error todo: improved types
        params: opts.payload,
      });
    } else if (opts.signatureType === SignatureTypes.EIP712) {
      // todo: implement
    }
    return '';
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({ address: '', chainId: '', walletType: WalletTypes.NONE });
  }, []);

  useEffect(() => {
    const onChainChanged = () => {
      window.location.reload();
    };

    if (wallet.walletType === WalletTypes.METAMASK) {
      console.log('adding');
      // @ts-expect-error window.ethereum.on does exist
      window.ethereum.on('chainChanged', onChainChanged);
      // @ts-expect-error window.ethereum.on does exist
      window.ethereum.on('accountsChanged', connectMetamask);
    }

    return () => {
      if (wallet.walletType === WalletTypes.METAMASK) {
        console.log('removing');
        // @ts-expect-error window.ethereum.off does exist
        window.ethereum.off('chainChanged', onChainChanged);
        // @ts-expect-error window.ethereum.off does exist
        window.ethereum.off('accountsChanged', connectMetamask);
      }
    };
  }, [wallet, connectMetamask]);

  return (
    <WalletContext.Provider
      value={{
        connectWallet,
        sign,
        disconnectWallet,

        walletAddress: wallet.address,
        walletChainId: wallet.chainId,
        walletType: wallet.walletType,
        isWalletConnected,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
