import { EvmMessageBase } from './base';
import { ethers, TransactionResponse } from 'ethers';
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

    return Boolean(
      fromAddress.length > 0 &&
        toAddress.length > 0 &&
        Number(amount) > 0 &&
        denom.length > 0,
    );
  }

  async buildTransaction(params: SendToolParams): Promise<TransactionResponse> {
    const { fromAddress, toAddress, amount, denom } = params;

    const { masksToValues } = getStoredMasks();

    const addressTo = masksToValues[toAddress] ?? '';
    const addressFrom = masksToValues[fromAddress] ?? '';

    const receivingAddress = ethers.getAddress(addressTo);
    const sendingAddress = ethers.getAddress(addressFrom);

    if (isNativeAsset(denom)) {
      return window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            to: sendingAddress,
            from: receivingAddress,
            value: ethers.parseEther(amount).toString(16),
            gasPrice: '0x4a817c800',
            gas: '0x76c0',
            data: '0x',
          },
        ],
      });
    } else {
      const rawTxAmount = String(
        !amount || Number.isNaN(Number(amount)) ? '0' : amount,
      );

      const contractAddress = ASSET_ADDRESSES[denom.toUpperCase()] ?? '';

      const contract = new ethers.Contract(
        contractAddress,
        erc20ABI,
        kavaEVMProvider,
      );

      const decimals = await contract.decimals();

      const formattedTxAmount = ethers.parseUnits(
        rawTxAmount,
        Number(decimals),
      );

      const txData = contract.interface.encodeFunctionData('transfer', [
        receivingAddress,
        formattedTxAmount,
      ]);

      return window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            to: contractAddress,
            from: sendingAddress,
            value: '0', // this must be zero
            gasPrice: '0x4a817c800',
            gas: '0x16120',
            data: txData,
          },
        ],
      });
    }
  }
}
