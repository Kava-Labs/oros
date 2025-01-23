import { ChainQuery, ChainType, OperationType } from '../../../../types/chain';
import { ethers } from 'ethers';
import { erc20ABI } from '../../../../tools/erc20ABI';
import { getStoredMasks } from '../../../../utils/chat/helpers';
import { ASSET_ADDRESSES, kavaEVMProvider } from '../../../../config/evm';
import { WalletConnection } from '../../../../types/chain';

export class EvmBalancesQuery implements ChainQuery<{}> {
  name = 'evm-balances';
  description = 'Returns the erc20 token balances for a given address';
  parameters = [
    {
      name: 'address',
      type: 'string',
      description: 'the address to check the balances',
      required: true,
    },
  ];
  operationType = OperationType.QUERY;
  chainType = ChainType.EVM;

  validate(params: {}, wallet: WalletConnection): boolean {
    const address = wallet.walletAddress;
    const { masksToValues } = getStoredMasks();

    const validatedAddress = masksToValues[address] ?? '';

    return validatedAddress.length > 0;
  }

  async executeQuery(params: {}, wallet: WalletConnection): Promise<string> {
    const address = wallet.walletAddress;
    const balanceCalls: (() => Promise<string>)[] = [];

    const { masksToValues } = getStoredMasks();
    const validatedAddress = masksToValues[address];

    // KAVA fetching is a bit different
    balanceCalls.push(async () => {
      try {
        const rawBalance = await kavaEVMProvider.getBalance(validatedAddress);
        const formattedBalance = ethers.formatUnits(rawBalance, 18);
        return `KAVA: ${formattedBalance}`;
      } catch (err) {
        return `KAVA: failed to fetch balance ${JSON.stringify(err)}`;
      }
    });

    // add other assets
    for (const asset in ASSET_ADDRESSES) {
      balanceCalls.push(async () => {
        const contract = new ethers.Contract(
          ASSET_ADDRESSES[asset],
          erc20ABI,
          kavaEVMProvider,
        );

        try {
          const decimals = await contract.decimals();
          const rawBalance = await contract.balanceOf(address);
          const formattedBalance = ethers.formatUnits(rawBalance, decimals);
          return `${asset}: ${formattedBalance}`;
        } catch (err) {
          return `${asset}: failed to fetch balance ${JSON.stringify(err)}`;
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
