import { InProgressTxDisplay } from '../../../../../components/InProgressTxDisplay';
import {
  ChainNames,
  chainRegistry,
} from '../../../../../config/chainsRegistry';
import {
  ChainMessage,
  ChainType,
  OperationType,
} from '../../../../../types/chain';
import { WalletStore, WalletTypes } from '../../../../../walletStore';

//  sent to model
interface ERC20ConvertParams {
  chainName: string;
  amount: string;
  denom: string;
  direction: 'coinToERC20' | 'ERC20ToCoin';
}

/**
 * Implementation of the Kava Lend MsgDeposit message type.
 */
export class ERC20Conversion implements ChainMessage<ERC20ConvertParams> {
  name = 'erc20Convert';
  description =
    'Converts an ERC20 asset to a cosmos Coin or cosmos coin to an ERC20 asset';
  chainType = ChainType.COSMOS;
  operationType = OperationType.TRANSACTION;
  walletMustMatchChainID = true;

  needsWallet = [WalletTypes.METAMASK];

  /**
   * Parameter definitions for the message.
   * Used for validation and OpenAI tool generation.
   */
  parameters = [
    {
      name: 'chainName',
      type: 'string',
      description: `name of the chain the user is interacting with, if not specified by the user assume ${ChainNames.KAVA_COSMOS}`,
      enum: [...Object.keys(chainRegistry[ChainType.COSMOS])],
      required: true,
    },
    {
      name: 'amount',
      type: 'string',
      description: 'Amount to convert',
      required: true,
    },
    {
      name: 'denom',
      type: 'string',
      description: 'Token denomination',
      required: true,
    },
    {
      name: 'direction',
      type: 'string',
      description:
        'direction of the conversion either from cosmos Coin to erc20 or erc20 to cosmos Coin',
      enum: ['coinToERC20', 'ERC20ToCoin'],
      required: true,
    },
  ];

  inProgressComponent() {
    return InProgressTxDisplay;
  }

  validate(params: ERC20ConvertParams, walletStore: WalletStore): boolean {
    if (!walletStore.getSnapshot().isWalletConnected) {
      throw new Error('please connect to a compatible wallet');
    }

    if (Array.isArray(this.needsWallet)) {
      if (!this.needsWallet.includes(walletStore.getSnapshot().walletType)) {
        throw new Error('please connect to a compatible wallet');
      }
    }

    // todo: validate
    console.log(params);

    return true;
  }

  async buildTransaction(
    params: ERC20ConvertParams,
    _walletStore: WalletStore,
  ): Promise<string> {
    console.log(params);

    // todo: implement

    return 'unimplemented';
  }
}
