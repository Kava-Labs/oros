import { ChainQuery, ChainType, OperationType } from '../../types/chain';
import { erc20ABI } from '../../utils/erc20ABI';
import { InProgressQueryDisplay } from '../../components/displayCards';
import { WalletStore, WalletTypes } from '../../stores/walletStore';
import {
  chainNameToolCallParam,
  chainRegistry,
  EVMChainConfig,
} from '../../config/chainsRegistry';

type EvmBalanceQueryParams = {
  chainName: string;
};

export class EvmBalancesQuery implements ChainQuery<EvmBalanceQueryParams> {
  name = 'evm-balances';
  description = 'Returns the erc20 token balances for a given address';
  parameters = [chainNameToolCallParam];
  operationType = OperationType.QUERY;
  chainType = ChainType.EVM;

  walletMustMatchChainID = false;
  needsWallet = [WalletTypes.METAMASK];

  private isMobileDevice(): boolean {
    // use regex to detect mobile devices
    const isMobileUserAgent =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent,
      );

    const isMobileViewport = window.innerWidth <= 768;

    return isMobileUserAgent && isMobileViewport;
  }

  validate(params: EvmBalanceQueryParams, walletStore: WalletStore): boolean {
    if (this.isMobileDevice()) {
      throw new Error('Use a desktop device to connect a wallet');
    }

    if (!walletStore.getSnapshot().isWalletConnected) {
      throw new Error('please connect to a compatible wallet');
    }

    if (Array.isArray(this.needsWallet)) {
      if (!this.needsWallet.includes(walletStore.getSnapshot().walletType)) {
        throw new Error('please connect to a compatible wallet');
      }
    }

    if (!chainRegistry[this.chainType][params.chainName]) {
      throw new Error(`unknown chain name ${params.chainName}`);
    }

    return true;
  }

  inProgressComponent() {
    return InProgressQueryDisplay;
  }

  async executeQuery(
    params: EvmBalanceQueryParams,
    walletStore: WalletStore,
  ): Promise<string> {
    const { ethers } = await import('ethers');
    const { rpcUrls, erc20Contracts, nativeToken, nativeTokenDecimals } =
      chainRegistry[this.chainType][params.chainName] as EVMChainConfig;
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);

    const address = walletStore.getSnapshot().walletAddress;
    const balanceCalls: (() => Promise<string>)[] = [];

    // native fetching is a bit different
    balanceCalls.push(async () => {
      try {
        const rawBalance = await rpcProvider.getBalance(address);
        const formattedBalance = ethers.formatUnits(
          rawBalance,
          nativeTokenDecimals,
        );
        return `${nativeToken}: ${formattedBalance}`;
      } catch (err) {
        console.log(err);
        return `KAVA: failed to fetch balance ${JSON.stringify(err)}`;
      }
    });

    // add other assets
    for (const asset in erc20Contracts) {
      balanceCalls.push(async () => {
        const contractAddress = erc20Contracts[asset].contractAddress;
        const displayName = erc20Contracts[asset].displayName;

        const contract = new ethers.Contract(
          contractAddress,
          erc20ABI,
          rpcProvider,
        );

        try {
          const decimals = await contract.decimals();
          const rawBalance = await contract.balanceOf(address);
          const formattedBalance = ethers.formatUnits(rawBalance, decimals);
          if (Number(formattedBalance) === 0) {
            return '';
          }

          return `${displayName}: ${formattedBalance}`;
        } catch (err) {
          console.error(
            `failed to fetch balance for ${displayName}: ${JSON.stringify(err)}`,
          );
          return '';
        }
      });
    }

    const results = await Promise.allSettled(balanceCalls.map((fn) => fn()));
    return results.reduce(
      (acc, res) =>
        acc + `${res.status === 'fulfilled' ? res.value : res.reason}\n`,
      '',
    );
  }
}
