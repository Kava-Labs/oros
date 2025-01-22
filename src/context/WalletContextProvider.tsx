import React, { useCallback, useEffect, useState } from 'react';
import {
  SignOpts,
  WalletConnectionOpts,
  WalletContext,
  WalletTypes,
} from './WalletContext';
import { connectMetamask, metamaskSign } from './wallets/metamask';

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

  const disconnectWallet = useCallback(() => {
    setWallet({ address: '', chainId: '', walletType: WalletTypes.NONE });
  }, []);

  const connectWallet = useCallback(
    async (opts: WalletConnectionOpts) => {
      switch (opts.walletType) {
        case WalletTypes.METAMASK: {
          await connectMetamask(setWallet);
          break;
        }
        case WalletTypes.NONE: {
          disconnectWallet(); // disconnect when passed WalletTypes.NONE
          break;
        }
        default:
          throw new Error(`unknown wallet type: ${opts.walletType}`);
      }
    },
    [disconnectWallet],
  );

  const sign = useCallback(
    async (opts: SignOpts) => {
      if (wallet.walletType === WalletTypes.METAMASK) {
        return metamaskSign(opts);
      }
      throw new Error(`sign: unsupported wallet ${wallet.walletType}`);
    },
    [wallet],
  );

  useEffect(() => {
    const onChainChange = () => {
      window.location.reload();
    };

    const onAccountChange = () => {
      connectMetamask(setWallet);
    };

    if (wallet.walletType === WalletTypes.METAMASK) {
      // @ts-expect-error window.ethereum.on does exist
      window.ethereum.on('chainChanged', onChainChange);
      // @ts-expect-error window.ethereum.on does exist
      window.ethereum.on('accountsChanged', onAccountChange);
    }

    return () => {
      if (wallet.walletType === WalletTypes.METAMASK) {
        // @ts-expect-error window.ethereum.off does exist
        window.ethereum.off('chainChanged', onChainChange);
        // @ts-expect-error window.ethereum.off does exist
        window.ethereum.off('accountsChanged', onAccountChange);
      }
    };
  }, [wallet]);

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
