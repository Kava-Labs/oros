import { ChainQuery, ChainType, OperationType } from '../../../../types/chain';
import { ethers } from 'ethers';
import { erc20ABI } from '../../../../tools/erc20ABI';
import { ASSET_ADDRESSES, kavaEVMProvider } from '../../../../config/evm';
import { QueryInProgress } from '../../../../components/QueryInProgress';
import { WalletStore, WalletTypes } from '../../../../walletStore';

export class EvmBalancesQuery implements ChainQuery<void> {
  name = 'evm-balances';
  description = 'Returns the erc20 token balances for a given address';
  parameters = [];
  operationType = OperationType.QUERY;
  chainType = ChainType.EVM;

  needsWallet = [WalletTypes.METAMASK];

  validate(_params: void, walletStore: WalletStore): boolean {
    if (!walletStore.getSnapshot().isWalletConnected) {
      throw new Error('please connect to a compatible wallet');
    }

    if (Array.isArray(this.needsWallet)) {
      if (!this.needsWallet.includes(walletStore.getSnapshot().walletType)) {
        throw new Error('please connect to a compatible wallet');
      }
    }

    return true;
  }

  inProgressComponent() {
    return QueryInProgress;
  }

  async executeQuery(_params: void, walletStore: WalletStore): Promise<string> {
    const address = walletStore.getSnapshot().walletAddress;
    const balanceCalls: (() => Promise<string>)[] = [];

    // KAVA fetching is a bit different
    balanceCalls.push(async () => {
      try {
        const rawBalance = await kavaEVMProvider.getBalance(address);
        const formattedBalance = ethers.formatUnits(rawBalance, 18);
        return `KAVA: ${formattedBalance}`;
      } catch (err) {
        console.log(err);
        return `KAVA: failed to fetch balance ${JSON.stringify(err)}`;
      }
    });

    // add other assets
    for (const asset in ASSET_ADDRESSES) {
      balanceCalls.push(async () => {
        const contractAddress = ASSET_ADDRESSES[asset].contractAddress;
        const displayName = ASSET_ADDRESSES[asset].displayName;

        const contract = new ethers.Contract(
          contractAddress,
          erc20ABI,
          kavaEVMProvider,
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
