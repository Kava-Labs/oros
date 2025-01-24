import { ChainQuery, ChainType, OperationType } from '../../../../types/chain';
import { ethers } from 'ethers';
import { erc20ABI } from '../../../../tools/erc20ABI';
import { QueryInProgress } from '../../../../components/QueryInProgress';
import { WalletStore, WalletTypes } from '../../../../walletStore';
import {
  chainNameToolCallParam,
  chainRegistry,
} from '../../../../config/chainsRegistry';

type EvmBalanceQueryParams = {
  chainName: string;
};

export class EvmBalancesQuery implements ChainQuery<EvmBalanceQueryParams> {
  name = 'evm-balances';
  description = 'Returns the erc20 token balances for a given address';
  parameters = [chainNameToolCallParam];
  operationType = OperationType.QUERY;
  chainType = ChainType.EVM;

  needsWallet = [WalletTypes.METAMASK];

  validate(_params: EvmBalanceQueryParams, walletStore: WalletStore): boolean {
    if (!walletStore.getSnapshot().isWalletConnected) {
      throw new Error('please connect to a compatible wallet');
    }

    if (Array.isArray(this.needsWallet)) {
      if (!this.needsWallet.includes(walletStore.getSnapshot().walletType)) {
        throw new Error('please connect to a compatible wallet');
      }
    }

    if (!chainRegistry[_params.chainName]) {
      throw new Error(`unknown chain name ${_params.chainName}`);
    }

    return true;
  }

  inProgressComponent() {
    return QueryInProgress;
  }

  async executeQuery(
    _params: EvmBalanceQueryParams,
    walletStore: WalletStore,
  ): Promise<string> {
    console.log(_params);

    const { evmRpcUrl, erc20Contracts } = chainRegistry[_params.chainName];
    const rpcProvider = new ethers.JsonRpcProvider(evmRpcUrl);



    const address = walletStore.getSnapshot().walletAddress;
    const balanceCalls: (() => Promise<string>)[] = [];

    // KAVA fetching is a bit different
    balanceCalls.push(async () => {
      try {
        const rawBalance = await rpcProvider.getBalance(address);
        const formattedBalance = ethers.formatUnits(rawBalance, 18);
        return `KAVA: ${formattedBalance}`;
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
          return `${displayName}: failed to fetch balance ${JSON.stringify(err)}`;
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
