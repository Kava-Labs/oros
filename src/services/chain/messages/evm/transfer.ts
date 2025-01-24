import { ethers } from 'ethers';
import { erc20ABI } from '../../../../tools/erc20ABI';
import { getERC20Record, getStoredMasks } from '../../../../utils/chat/helpers';
import { InProgressTxDisplay } from '../../../../components/InProgressTxDisplay';
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
  walletMustMatchChainID = true;

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
    return InProgressTxDisplay;
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
    if (!validToAddress.length) {
      throw new Error(`please provide a valid address to send to`);
    }

    if (Number(amount) <= 0) {
      throw new Error(`amount must be greater than zero`);
    }

    const { erc20Contracts, nativeToken } =
      chainRegistry[this.chainType][params.chainName];

    const validDenomWithContract =
      getERC20Record(denom, erc20Contracts) !== null ||
      denom.toUpperCase() === nativeToken;

    if (!validDenomWithContract) {
      throw new Error(`failed to find contract address for ${denom}`);
    }

    return true;
  }

  async buildTransaction(
    params: SendToolParams,
    walletStore: WalletStore,
  ): Promise<string> {
    const { toAddress, amount, denom } = params;

    const { erc20Contracts, rpcUrls, nativeToken, nativeTokenDecimals } =
      chainRegistry[this.chainType][params.chainName];
    const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);

    try {
      let txParams: Record<string, string>;

      const { masksToValues } = getStoredMasks();

      //  validate method will check that these mask-addresses exist
      const addressTo = masksToValues[toAddress];
      const addressFrom = walletStore.getSnapshot().walletAddress;

      const receivingAddress = ethers.getAddress(addressTo);
      const sendingAddress = ethers.getAddress(addressFrom);

      if (denom.toUpperCase() === nativeToken) {
        txParams = {
          to: receivingAddress,
          data: '0x',
          value: ethers.parseEther(amount).toString(nativeTokenDecimals),
        };
      } else {
        // ! because this already passed validation
        const { contractAddress } = getERC20Record(denom, erc20Contracts)!;

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

      const hash = await walletStore.sign({
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

      try {
        const timeout = 20000; // upto 20 seconds
        const confirmations = 1;
        await rpcProvider.waitForTransaction(hash, confirmations, timeout);
      } catch (err) {
        console.error(err);
      }

      return hash;
    } catch (e) {
      throw `An error occurred building the transaction: ${JSON.stringify(e)}`;
    }
  }
}
