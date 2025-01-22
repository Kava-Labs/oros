import React, { useCallback, useEffect, useState } from 'react';
import {
  SignatureTypes,
  SignOpts,
  WalletConnectionOpts,
  WalletContext,
  WalletTypes,
} from './WalletContext';
import {
  addMetamaskChangeListeners,
  connectMetamask,
  metamaskSign,
  removeMetamaskChangeListeners,
} from './wallets/metamask';

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
  }, []);

  const sign = useCallback(
    async (opts: SignOpts) => {
      if (wallet.walletType === WalletTypes.METAMASK) {
        return metamaskSign(opts);
      }
      throw new Error(`sign: unsupported wallet ${wallet.walletType}`);
    },
    [wallet],
  );

  const disconnectWallet = useCallback(() => {
    setWallet({ address: '', chainId: '', walletType: WalletTypes.NONE });
  }, []);

  useEffect(() => {
    const onChainChanged = () => {
      window.location.reload();
    };

    if (wallet.walletType === WalletTypes.METAMASK) {
      console.log('adding');
      addMetamaskChangeListeners({
        onAccountChange: connectMetamask,
        onChainChange: onChainChanged,
      });
    }

    return () => {
      if (wallet.walletType === WalletTypes.METAMASK) {
        console.log('removing');
        removeMetamaskChangeListeners({
          onAccountChange: connectMetamask,
          onChainChange: onChainChanged,
        });
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
