import React, { useCallback, useState } from 'react';
import {
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

  const connectWallet = useCallback(async (opts: WalletConnectionOpts) => {
    switch (opts.walletType) {
      case WalletTypes.METAMASK: {
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
    return '';
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({ address: '', chainId: '', walletType: WalletTypes.NONE });
  }, []);

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
