import { ethers } from 'ethers';
import { erc20ABI } from '../../../../tools/erc20ABI';
import { getStoredMasks, isNativeAsset } from '../../../../utils/chat/helpers';
import { TransactionDisplay } from '../../../../components/TransactionDisplay';
import {
  ChainMessage,
  OperationType,
  ChainType,
} from '../../../../types/chain';
import {
  SignatureTypes,
  WalletStore,
  WalletTypes,
} from '../../../../walletStore';
import {
  chainNameToolCallParam,
  chainRegistry,
} from '../../../../config/chainsRegistry';

interface SendToolParams {
  chainName: string;
  toAddress: string;
  amount: string;
  denom: string;
}

export class EvmTransferMessage implements ChainMessage<SendToolParams> {
  name = 'evm-transfer';
  description = 'Send erc20 tokens from one address to another';
  operationType = OperationType.TRANSACTION;
  chainType = ChainType.EVM;
  needsWallet = [WalletTypes.METAMASK];

  parameters = [
    chainNameToolCallParam,
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

  validate(params: SendToolParams, walletStore: WalletStore): boolean {
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

    const { toAddress, amount, denom } = params;

    const { masksToValues } = getStoredMasks();

    const validToAddress = masksToValues[toAddress] ?? '';

    const { erc20Contracts } = chainRegistry[this.chainType][params.chainName];

    const validDenomWithContract =
      denom.toUpperCase() in erc20Contracts || isNativeAsset(denom);

    return Boolean(
      validToAddress.length > 0 &&
        Number(amount) > 0 &&
        denom.length > 0 &&
        validDenomWithContract,
    );
  }

  async buildTransaction(
    params: SendToolParams,
    walletStore: WalletStore,
  ): Promise<string> {
    const { toAddress, amount, denom } = params;

    const { erc20Contracts, rpcUrl } =
      chainRegistry[this.chainType][params.chainName];
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);

    try {
      let txParams: Record<string, string>;

      const { masksToValues } = getStoredMasks();

      //  validate method will check that these mask-addresses exist
      const addressTo = masksToValues[toAddress];
      const addressFrom = walletStore.getSnapshot().walletAddress;

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
          erc20Contracts[denom.toUpperCase()].contractAddress;

        const contract = new ethers.Contract(
          contractAddress,
          erc20ABI,
          rpcProvider,
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

      return walletStore.sign({
        chainId: `0x${Number(2222).toString(16)}`,
        signatureType: SignatureTypes.EVM,
        payload: {
          method: 'eth_sendTransaction',
          params: [
            {
              ...txParams,
              from: sendingAddress,
              gasPrice: '0x4a817c800',
              gas: '0x16120',
            },
          ],
        },
      });
    } catch (e) {
      throw `An error occurred building the transaction: ${JSON.stringify(e)}`;
    }
  }
}
