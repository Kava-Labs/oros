import { EvmMessageBase } from './base';
import { ethers } from 'ethers';
import { ASSET_ADDRESSES, kavaEVMProvider } from '../../../../config/evm';
import { erc20ABI } from '../../../../tools/erc20ABI';
import { getStoredMasks, isNativeAsset } from '../../../../utils/chat/helpers';

interface SendToolParams {
  fromAddress: string;
  toAddress: string;
  amount: string;
  denom: string;
}

export class EvmTransferMessage extends EvmMessageBase<SendToolParams> {
  name = 'evm-transfer';
  description = 'Send erc20 tokens from one address to another';

  parameters = [
    {
      name: 'fromAddress',
      type: 'string',
      description: 'Sender address',
      required: true,
    },
    {
      name: 'toAddress',
      type: 'string',
      description: 'Recipient address',
      required: true,
    },
    {
      name: 'amount',
      type: 'string',
      description: 'Amount to send (in base units)',
      required: true,
    },
    {
      name: 'denom',
      type: 'string',
      description: 'Token denomination',
      required: true,
    },
  ];

  validate(params: SendToolParams): boolean {
    const { fromAddress, toAddress, amount, denom } = params;

    const { masksToValues } = getStoredMasks();

    const validFromAddress = masksToValues[fromAddress] ?? '';
    const validToAddress = masksToValues[toAddress] ?? '';

    return Boolean(
      validFromAddress.length > 0 &&
        validToAddress.length > 0 &&
        Number(amount) > 0 &&
        denom.length > 0,
    );
  }

  async buildTransaction(params: SendToolParams): Promise<string> {
    const { fromAddress, toAddress, amount, denom } = params;

    try {
      let txParams: Record<string, string>;

      const { masksToValues } = getStoredMasks();

      //  validate method will check that these mask-addresses exist
      const addressTo = masksToValues[toAddress];
      const addressFrom = masksToValues[fromAddress];

      const receivingAddress = ethers.getAddress(addressTo);
      const sendingAddress = ethers.getAddress(addressFrom);

      if (isNativeAsset(denom)) {
        txParams = {
          to: sendingAddress,
          data: '0x',
          value: ethers.parseEther(amount).toString(16),
        };
      } else {
        const contractAddress = ASSET_ADDRESSES[denom.toUpperCase()] ?? '';
        const contract = new ethers.Contract(
          contractAddress,
          erc20ABI,
          kavaEVMProvider,
        );
        const decimals = await contract.decimals();
        const formattedTxAmount = ethers.parseUnits(amount, Number(decimals));

        txParams = {
          to: contractAddress,
          value: '0', // this must be zero
          data: contract.interface.encodeFunctionData('transfer', [
            receivingAddress,
            formattedTxAmount,
          ]),
        };
      }

      return window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            ...txParams,
            from: fromAddress,
            gasPrice: '0x4a817c800',
            gas: '0x76c0',
          },
        ],
      });
    } catch (e) {
      throw `An error occurred building the transaction: ${JSON.stringify(e)}`;
    }
  }
}
