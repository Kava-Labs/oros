import { QueryBase } from './base';
import { ethers } from 'ethers';
import { erc20ABI } from '../../../../tools/erc20ABI';
import { getStoredMasks } from '../../../../utils/chat/helpers';
import { ASSET_ADDRESSES, kavaEVMProvider } from '../../../../config/evm';

interface AddressQuery {
  address: string;
}

export class EvmBalancesQuery extends QueryBase<AddressQuery> {
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

  validate(params: AddressQuery): boolean {
    const { address } = params;
    const { masksToValues } = getStoredMasks();

    const validatedAddress = masksToValues[address] ?? '';

    return validatedAddress.length > 0;
  }

  async executeQuery(params: AddressQuery): Promise<string> {
    const { address } = params;
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
