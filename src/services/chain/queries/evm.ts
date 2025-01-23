import { ethers } from 'ethers';
import { ASSET_ADDRESSES, kavaEVMProvider } from '../../../config/evm';
import { ChainQuery } from '../../../types/chain';
import { MessageParam } from '../../../types/messages';
import { erc20ABI } from '../../../tools/erc20ABI';
import { ToolCallStream } from '../../../toolCallStreamStore';
import { unmaskAddresses } from '../../../utils/chat/unmaskAddresses';
import { getStoredMasks } from '../../../utils/chat/helpers';

export class EVMBalanceQuery implements ChainQuery {
  name: string = 'fetchEVMBalances';
  operationType = 'query' as const;
  chainType = 'evm' as const;
  description: string = 'fetches EVM balances for a user';
  parameters: MessageParam[] = [
    {
      name: 'address',
      type: 'string',
      description: 'address to get the balance for',
      required: true,
    },
  ];

  validate(params: unknown) {
    // todo: validate
    return true;
  }

  async executeQuery(params: unknown): Promise<string> {
    const address = unmaskAddresses(
      // @ts-expect-error todo: fix types
      params.address,
      getStoredMasks().masksToValues,
    );

    const balanceCalls: (() => Promise<string>)[] = [];

    // KAVA fetching is a bit different
    balanceCalls.push(async () => {
      try {
        const rawBalance = await kavaEVMProvider.getBalance(address);
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
          if (Number(formattedBalance) === 0) return '';
          return `${asset}: ${formattedBalance}`;
        } catch (err) {
          return `${asset}: failed to fetch balance ${JSON.stringify(err)}`;
        }
      });
    }

    const results = await Promise.allSettled(balanceCalls.map((fn) => fn()));
    return results.reduce((acc, res) => {
      return (acc += `${res.status === 'fulfilled' ? res.value : res.reason}\n`);
    }, '');
  }
}
