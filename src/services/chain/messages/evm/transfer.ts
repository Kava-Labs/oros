import { ethers } from 'ethers';
import { ASSET_ADDRESSES, kavaEVMProvider } from '../../../../config/evm';
import { erc20ABI } from '../../../../tools/erc20ABI';
import { getStoredMasks, isNativeAsset } from '../../../../utils/chat/helpers';
import { TransactionDisplay } from '../../../../components/TransactionDisplay';
import {
  WalletConnection,
  ChainMessage,
  OperationType,
  ChainType,
} from '../../../../types/chain';

interface SendToolParams {
  toAddress: string;
  amount: string;
  denom: string;
}

export class EvmTransferMessage implements ChainMessage<SendToolParams> {
  name = 'evm-transfer';
  description = 'Send erc20 tokens from one address to another';
  operationType = OperationType.TRANSACTION;
  chainType = ChainType.EVM;
  compatibleWallets = '*' as const;

  parameters = [
    {
      name: 'toAddress',
      type: 'string',
      description: 'Recipient address',
      required: true,
    },
    {
      name: 'amount',
      type: 'string',
      description: 'Amount to send',
      required: true,
    },
    {
      name: 'denom',
      type: 'string',
      description: 'Token denomination',
      required: true,
    },
  ];

  inProgressComponent() {
    return TransactionDisplay;
  }

  validate(params: SendToolParams, wallet: WalletConnection): boolean {
    if (!wallet.isWalletConnected) {
      throw new Error('please connect to a compatible wallet');
    }

    if (Array.isArray(this.compatibleWallets)) {
      if (!this.compatibleWallets.includes(wallet.walletType)) {
        throw new Error('please connect to a compatible wallet');
      }
    }

    const { toAddress, amount, denom } = params;

    const { masksToValues } = getStoredMasks();

    const validToAddress = masksToValues[toAddress] ?? '';

    const validDenomWithContract =
      denom.toUpperCase() in ASSET_ADDRESSES || isNativeAsset(denom);

    return Boolean(
      validToAddress.length > 0 &&
        Number(amount) > 0 &&
        denom.length > 0 &&
        validDenomWithContract,
    );
  }

  async buildTransaction(
    params: SendToolParams,
    wallet: WalletConnection,
  ): Promise<string> {
    const { toAddress, amount, denom } = params;

    try {
      let txParams: Record<string, string>;

      const { masksToValues } = getStoredMasks();

      //  validate method will check that these mask-addresses exist
      const addressTo = masksToValues[toAddress];
      const addressFrom = wallet.walletAddress;

      const receivingAddress = ethers.getAddress(addressTo);
      const sendingAddress = ethers.getAddress(addressFrom);

      if (isNativeAsset(denom)) {
        txParams = {
          to: receivingAddress,
          data: '0x',
          value: ethers.parseEther(amount).toString(16),
        };
      } else {
        const contractAddress =
          ASSET_ADDRESSES[denom.toUpperCase()].contractAddress ?? '';

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
            from: sendingAddress,
            gasPrice: '0x4a817c800',
            gas: '0x16120',
          },
        ],
      });
    } catch (e) {
      throw `An error occurred building the transaction: ${JSON.stringify(e)}`;
    }
  }
}
